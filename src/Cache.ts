import { safeRm } from 'fs-remove-compat';

import get from './get.ts';
import getSync from './getSync.ts';
import hash from './hash.ts';
import type { CacheOptions, ClearCallback, GetCallback, GetOptions } from './types.ts';
import update from './update.ts';

export default class Cache {
  cachePath: string;
  options: CacheOptions;

  constructor(cachePath: string, options: CacheOptions = {}) {
    if (!(this instanceof Cache)) throw new Error('Cache needs to be called with new');
    if (!cachePath) throw new Error('Cache needs cachePath');
    this.cachePath = cachePath;
    this.options = options;
    if (!this.options.hash) this.options.hash = hash;
  }

  get<T>(endpoint: string, callback: GetCallback<T>): void;
  get<T>(endpoint: string, options: GetOptions, callback: GetCallback<T>): void;
  get<T>(endpoint: string, options?: GetOptions): Promise<T | null>;
  get<T>(endpoint: string, options?: GetOptions | GetCallback<T>, callback?: GetCallback<T>): void | Promise<T | null> {
    callback = typeof options === 'function' ? options : callback;
    options = typeof options === 'function' ? {} : ((options || {}) as GetOptions);

    function worker(endpoint, options, callback) {
      options.force ? update.call(this, endpoint, callback) : get.call(this, endpoint, callback);
    }

    if (typeof callback === 'function') return worker.call(this, endpoint, options, callback);
    return new Promise((resolve, reject) => worker.call(this, endpoint, options, (err, json) => (err ? reject(err) : resolve(json))));
  }

  getSync<T>(endpoint: string): T | null {
    return getSync.call(this, endpoint);
  }

  clear(callback: ClearCallback): void;
  clear(): Promise<void>;
  clear(callback?: ClearCallback): void | Promise<void> {
    function worker(callback) {
      // ignore errors since it is fine to delete a directory that doesn't exist from a cache standpoint
      safeRm(this.cachePath, callback.bind(null, null));
    }

    if (typeof callback === 'function') return worker.call(this, callback);
    return new Promise((resolve, reject) =>
      worker.call(this, (err) => {
        err ? reject(err) : resolve();
      })
    );
  }
}
