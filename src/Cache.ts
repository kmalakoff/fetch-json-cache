import rimraf2 from 'rimraf2';

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

  get<T>(endpoint: string, options?: GetOptions | GetCallback<T>, callback?: GetCallback<T>): undefined | Promise<object | null> {
    if (typeof options === 'function') {
      callback = options as GetCallback<T>;
      options = null;
    }
    options = options || {};

    function worker(endpoint, options, callback) {
      (options as GetOptions).force ? update.call(this, endpoint, callback) : get.call(this, endpoint, callback);
    }

    if (typeof callback === 'function') return worker.call(this, endpoint, options, callback) as undefined;
    return new Promise((resolve, reject) => worker.call(this, endpoint, options, (err, json) => (err ? reject(err) : resolve(json))));
  }

  getSync<T>(endpoint: string): T | null {
    // TODO: add async fetching
    return getSync.call(this, endpoint);
  }

  clear(callback?: ClearCallback): undefined | Promise<undefined> {
    function worker(callback) {
      // ignore errors since it is fine to delete a directory that doesn't exist from a cache standpoint
      rimraf2(this.cachePath, { disableGlob: true }, callback.bind(null, null));
    }

    if (typeof callback === 'function') return worker.call(this, callback);
    return new Promise((resolve, reject) =>
      worker.call(this, (err) => {
        err ? reject(err) : resolve(undefined);
      })
    );
  }
}
