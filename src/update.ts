import fs from 'fs';
import { rm } from 'fs-remove-compat';
import { getContent } from 'get-file-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Queue from 'queue-cb';
import { renameInto } from 'staged-cache';
import tempSuffix from 'temp-suffix';

import type { CacheContext, Record, UpdateCallback } from './types.ts';

// the plain file that stops cachePath from being a folder: cachePath itself or an ancestor below the first existing folder; null when none
function findPlainFile(target: string, callback: (file: string | null) => void): void {
  fs.stat(target, (err, stats) => {
    if (!err) return callback(stats.isDirectory() ? null : target);
    const parent = path.dirname(target);
    if (parent === target) return callback(null);
    findPlainFile(parent, callback);
  });
}

// mkdirp reports EEXIST (or ENOTDIR) when a plain file is in the way; name that file, otherwise keep the original error
function cacheFolderError(cachePath: string, err: NodeJS.ErrnoException, callback: (err: Error) => void): void {
  if (err.code !== 'EEXIST' && err.code !== 'ENOTDIR') return callback(err);
  findPlainFile(cachePath, (file) => {
    if (!file) return callback(err);
    const wrapped = new Error(`${file} is a file, so the cache folder ${cachePath} cannot be created`) as NodeJS.ErrnoException;
    wrapped.code = 'ENOTDIR';
    wrapped.syscall = 'mkdir';
    wrapped.path = file;
    (wrapped as NodeJS.ErrnoException & { cause?: Error }).cause = err;
    callback(wrapped);
  });
}

export default function update<T>(this: CacheContext, endpoint: string, callback: UpdateCallback<T>): void {
  const fullPath = path.join(this.cachePath, `${this.options.hash?.(endpoint)}.json`);

  mkdirp(this.cachePath, (err) => {
    if (err) return cacheFolderError(this.cachePath, err as NodeJS.ErrnoException, callback);

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
