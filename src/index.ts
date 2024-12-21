import './polyfills.cjs';
import rimraf2 from 'rimraf2';

import get from './get.js';
import getSync from './getSync.js';
import hash from './hash.js';
import update from './update.js';

export interface CacheOptions {
  hash?: (string: string) => string;
}

export default class Cache {
  cacheDirectory: string;
  options: CacheOptions;

  constructor(cacheDirectory, options: CacheOptions = {}) {
    if (!(this instanceof Cache)) throw new Error('Cache needs to be called with new');
    if (!cacheDirectory) throw new Error('Cache needs cacheDirectory');
    this.cacheDirectory = cacheDirectory;
    this.options = options;
    if (!this.options.hash) this.options.hash = hash;
  }

  get(endpoint: string, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    options = options || {};

    if (typeof callback === 'function') return options.force ? update.call(this, endpoint, callback) : get.call(this, endpoint, callback);
    return new Promise((resolve, reject) => {
      this.get(endpoint, options, (err, json) => {
        err ? reject(err) : resolve(json);
      });
    });
  }

  getSync(endpoint, _options) {
    // TODO: add async fetching
    return getSync.call(this, endpoint);
  }

  clear(callback) {
    if (typeof callback === 'function')
      return rimraf2(this.cacheDirectory, { disableGlob: true }, (_err) => {
        _err = null; // ignore errors since it is fine to delete a directory that doesn't exist from a cache standpoint
        callback();
      });
    return new Promise((resolve, reject) => {
      this.clear((err, json) => {
        err ? reject(err) : resolve(json);
      });
    });
  }
}
