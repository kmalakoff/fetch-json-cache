import fs from 'fs';
import path from 'path';

import type { CacheContext, Record } from './types.ts';

interface DatedHeaders {
  date?: string;
  age?: string;
}

export function parseRecord<T>(contents: Buffer | string): Record<T> | null {
  try {
    const record = JSON.parse(contents.toString());
    return record && typeof record === 'object' && record.headers && typeof record.headers === 'object' ? record : null;
  } catch (_err) {
    return null;
  }
}

// seconds since the epoch when the server produced the body: its date minus the time it sat in a cache
export function fetchTime(record: Record<unknown>): number {
  const headers = (record.headers || {}) as DatedHeaders;
  const date = Date.parse(headers.date as string);
  const age = +(headers.age as string);
  return (Number.isNaN(date) ? 0 : date / 1000) - (Number.isNaN(age) ? 0 : age);
}

// a tie goes to the cache record
export function newest<T>(cached: Record<T> | null, seeded: Record<T> | null): Record<T> | null {
  if (!cached) return seeded;
  if (!seeded) return cached;
  return fetchTime(seeded) > fetchTime(cached) ? seeded : cached;
}

// the seed folder, unless it is the cache folder itself
export function seedFolder(context: CacheContext): string | null {
  const seedPath = context.options.seedPath;
  return seedPath && path.resolve(seedPath) !== path.resolve(context.cachePath) ? seedPath : null;
}

export function recordFile(context: CacheContext, folder: string, endpoint: string): string {
  return path.join(folder, `${context.options.hash?.(endpoint)}.json`);
}

export function readRecord<T>(context: CacheContext, folder: string, endpoint: string, callback: (record: Record<T> | null) => void): void {
  fs.readFile(recordFile(context, folder, endpoint), (err, contents) => callback(err ? null : parseRecord<T>(contents)));
}

export function readRecordSync<T>(context: CacheContext, folder: string, endpoint: string): Record<T> | null {
  try {
    return parseRecord<T>(fs.readFileSync(recordFile(context, folder, endpoint), 'utf8'));
  } catch (_err) {
    return null;
  }
}
