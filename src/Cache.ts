import { safeRm } from 'fs-remove-compat';

import get from './get.ts';
import getSync from './getSync.ts';
import hash from './hash.ts';
import type { CacheContext, CacheOptions, ClearCallback, GetCallback, GetOptions, UpdateCallback } from './types.ts';
import update from './update.ts';

export default class Cache<TWire = unknown, TStored = TWire> {
  cachePath: string;
  options: CacheOptions<TWire, TStored>;

  constructor(cachePath: string, options: CacheOptions<TWire, TStored> = {}) {
    if (!(this instanceof Cache)) throw new Error('Cache needs to be called with new');
    if (!cachePath) throw new Error('Cache needs cachePath');
    this.cachePath = cachePath;
    this.options = options;
    if (!this.options.hash) this.options.hash = hash;
  }

  get<T = TStored>(endpoint: string, callback: GetCallback<T>): void;
  get<T = TStored>(endpoint: string, options: GetOptions, callback: GetCallback<T>): void;
  get<T = TStored>(endpoint: string, options?: GetOptions): Promise<T | null>;
  get<T = TStored>(endpoint: string, options?: GetOptions | GetCallback<T>, callback?: GetCallback<T>): void | Promise<T | null> {
    callback = typeof options === 'function' ? options : callback;
    options = typeof options === 'function' ? {} : ((options || {}) as GetOptions);

    const worker = (endpoint: string, options: GetOptions, callback: GetCallback<T>) => {
      const context = this as unknown as CacheContext;
      options.force ? update.call(context, endpoint, callback as unknown as UpdateCallback<unknown>) : get.call(context, endpoint, callback as unknown as GetCallback<unknown>);
    };

    if (typeof callback === 'function') return worker(endpoint, options, callback);
    return new Promise((resolve, reject) => worker(endpoint, options as GetOptions, (err, json) => (err ? reject(err) : resolve(json as T | null))));
  }

  getSync<T = TStored>(endpoint: string): T | null {
    return getSync.call(this as unknown as CacheContext, endpoint) as T | null;
  }

  clear(callback: ClearCallback): void;
  clear(): Promise<void>;
  clear(callback?: ClearCallback): void | Promise<void> {
    const worker = (callback: ClearCallback) => {
      safeRm(this.cachePath, () => callback());
    };

    if (typeof callback === 'function') return worker(callback);
    return new Promise((resolve, reject) => worker((err) => (err ? reject(err) : resolve())));
  }
}
