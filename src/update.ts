import fs from 'fs';
import { rm } from 'fs-remove-compat';
import { getContent } from 'get-file-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Queue from 'queue-cb';
import tempSuffix from 'temp-suffix';

import type { CacheContext, Record, UpdateCallback } from './types.ts';

// Replace in one rename so a reader never finds the file missing. A refused rename (Windows reports EPERM when the
// destination is locked) is a lost race only if a complete file is at the destination; the destination is never removed.
function renameInto(from: string, to: string, callback: (err?: Error | null) => void): void {
  fs.rename(from, to, (err) => {
    if (!err) return callback();
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'EPERM' && code !== 'EEXIST' && code !== 'ENOTEMPTY') return callback(err);
    fs.stat(to, (statErr, stats) => {
      if (statErr || !stats.isFile()) return callback(err);
      rm(from, () => callback());
    });
  });
}

export default function update<T>(this: CacheContext, endpoint: string, callback: UpdateCallback<T>): void {
  const fullPath = path.join(this.cachePath, `${this.options.hash?.(endpoint)}.json`);

  mkdirp(this.cachePath, (err) => {
    if (err && (err as NodeJS.ErrnoException).code !== 'EEXIST') return callback(err);

    getContent(endpoint, 'utf8', (err, res) => {
      if (err) return callback(err);

      try {
        const parsed = JSON.parse(res?.content ?? 'null');
        const body = this.options.transform ? this.options.transform(parsed, endpoint) : parsed;
        const record = { headers: res?.headers ?? {}, body } as Record<T>;
        const tempFile = `${fullPath}-${tempSuffix()}`;

        const queue = new Queue(1);
        queue.defer((cb) => fs.writeFile(tempFile, JSON.stringify(record), 'utf8', (err) => cb(err)));
        queue.defer((cb) => renameInto(tempFile, fullPath, cb));
        queue.await((err) => {
          if (!err) return callback(undefined, record.body);
          rm(tempFile, () => callback(err));
        });
      } catch (err) {
        return callback(err as Error);
      }
    });
  });
}
