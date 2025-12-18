import fs from 'fs';
import { head } from 'get-file-compat';
import path from 'path';

import update from './update.ts';

interface GetError {
  code?: string;
}

interface GetHeaders {
  etag?: string;
}

import type { GetCallback } from './types.ts';

export default function getCache<T>(endpoint: string, callback: GetCallback<T>): void {
  const fullPath = path.join(this.cachePath, `${this.options.hash(endpoint)}.json`);
  fs.readFile(fullPath, (err, contents) => {
    // doesn't exist so create
    if (err) {
      update.call(this, endpoint, (err, json) => {
        err ? callback(err) : callback(null, json);
      });
    }
    // check existing if etag changed and if so, recache
    else {
      const record = JSON.parse(contents.toString());
      head(endpoint, (err, res) => {
        // not accessible
        if (err) {
          if ((err as GetError).code === 'ENOTFOUND' || err.message.indexOf('routines:SSL23_GET_SERVER_HELLO') >= 0) return callback(null, record.body);
          return callback(err);
        }
        if ((res.headers as GetHeaders).etag === record.headers.etag) return callback(null, record.body);
        update.call(this, endpoint, (err, json) => {
          err ? callback(err) : callback(null, json);
        });
      });
    }
  });
}
