import fs from 'fs';
import { rm } from 'fs-remove-compat';
import { getContent } from 'get-file-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Queue from 'queue-cb';
import tempSuffix from 'temp-suffix';

import type { Record, UpdateCallback } from './types.ts';

export default function update<T>(endpoint: string, callback: UpdateCallback<T>): undefined {
  const fullPath = path.join(this.cachePath, `${this.options.hash(endpoint)}.json`);

  mkdirp(this.cachePath, (err) => {
    if (err && err.code !== 'EEXIST') return callback(err);

    getContent(endpoint, 'utf8', (err, res) => {
      if (err) return callback(err);

      try {
        const body = JSON.parse(res.content);
        const record = { headers: res.headers, body } as Record<T>;
        const tempFile = `${fullPath}-${tempSuffix()}`;

        const queue = new Queue(1);
        queue.defer(fs.writeFile.bind(null, tempFile, JSON.stringify(record), 'utf8'));
        queue.defer((cb) => rm(fullPath, cb.bind(null, null)));
        queue.defer(fs.rename.bind(null, tempFile, fullPath));
        queue.await((err) => {
          if (!err) return callback(null, record.body);
          // cleanup the temp file if the operation failed
          rm(tempFile, callback.bind(err));
        });
      } catch (err) {
        return callback(err);
      }
    });
  });
}
