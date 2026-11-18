import { head } from 'get-file-compat';

import { newest, readRecord, seedFolder } from './record.ts';
import update from './update.ts';

interface GetHeaders {
  etag?: string;
}

import type { CacheContext, GetCallback, Record } from './types.ts';

// the freshness check is only worth waiting so long for when a good copy is on disk
const FRESHNESS_TIMEOUT = 10000;

export default function getCache<T>(this: CacheContext, endpoint: string, callback: GetCallback<T>): void {
  const seed = seedFolder(this);
  readRecord<T>(this, this.cachePath, endpoint, (cached) => {
    const found = (seeded: Record<T> | null) => {
      const record = newest(cached, seeded);
      // missing or unreadable everywhere is a miss
      if (!record) {
        return update.call(this, endpoint, (err, json) => {
          err ? callback(err) : callback(undefined, json as T | undefined);
        });
      }
      // check existing if etag changed and if so, recache
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
    };
    if (seed) readRecord<T>(this, seed, endpoint, found);
    else found(null);
  });
}
