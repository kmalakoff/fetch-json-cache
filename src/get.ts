import fs from 'fs';
import { head } from 'get-file-compat';
import path from 'path';

import update from './update.ts';

interface GetHeaders {
  etag?: string;
}

import type { CacheContext, GetCallback, Record } from './types.ts';

// the freshness check is only worth waiting so long for when a good copy is on disk
const FRESHNESS_TIMEOUT = 10000;

function parseRecord<T>(contents: Buffer): Record<T> | null {
  try {
    const record = JSON.parse(contents.toString());
    return record && typeof record === 'object' && record.headers && typeof record.headers === 'object' ? record : null;
  } catch (_err) {
    return null;
  }
}

export default function getCache<T>(this: CacheContext, endpoint: string, callback: GetCallback<T>): void {
  const fullPath = path.join(this.cachePath, `${this.options.hash?.(endpoint)}.json`);
  fs.readFile(fullPath, (err, contents) => {
    // doesn't exist so create
    if (err) {
      update.call(this, endpoint, (err, json) => {
        err ? callback(err) : callback(undefined, json as T | undefined);
      });
    }
    // check existing if etag changed and if so, recache
    else {
      const record = parseRecord<T>(contents);
      // a record that cannot be read back is a miss
      if (!record) {
        return update.call(this, endpoint, (err, json) => {
          err ? callback(err) : callback(undefined, json as T | undefined);
        });
      }
      head(endpoint, { timeout: FRESHNESS_TIMEOUT }, (err, res) => {
        // the freshness check failed (unreachable, timed out, reset...): the cached copy is the last good one
        if (err) return callback(undefined, record.body);
        const headers = res?.headers as GetHeaders | undefined;
        // without an etag on both sides there is nothing to compare, so the copy is stale
        const etag = headers?.etag;
        if (etag !== undefined && etag === (record.headers as GetHeaders).etag) return callback(undefined, record.body);
        update.call(this, endpoint, (err, json) => {
          err ? callback(err) : callback(undefined, json as T | undefined);
        });
      });
    }
  });
}
