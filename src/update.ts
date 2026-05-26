import fs from 'fs';
import { rm } from 'fs-remove-compat';
import { getContent } from 'get-file-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Queue from 'queue-cb';
import tempSuffix from 'temp-suffix';

import type { CacheContext, Record, UpdateCallback } from './types.ts';

export default function update<T>(this: CacheContext, endpoint: string, callback: UpdateCallback<T>): void {
  const fullPath = path.join(this.cachePath, `${this.options.hash?.(endpoint)}.json`);

  mkdirp(this.cachePath, (err) => {
    if (err && (err as NodeJS.ErrnoException).code !== 'EEXIST') return callback(err);

    getContent(endpoint, 'utf8', (err, res) => {
      if (err) return callback(err);

      try {
        const body = JSON.parse(res?.content ?? 'null');
        const record = { headers: res?.headers ?? {}, body } as Record<T>;
        const tempFile = `${fullPath}-${tempSuffix()}`;

        const queue = new Queue(1);
        queue.defer((cb) => fs.writeFile(tempFile, JSON.stringify(record), 'utf8', (err) => cb(err)));
        queue.defer((cb) => rm(fullPath, { force: true }, (err?: NodeJS.ErrnoException | null) => cb(err)));
        queue.defer((cb) => fs.rename(tempFile, fullPath, (err) => cb(err)));
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
