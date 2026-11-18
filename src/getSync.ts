import fs from 'fs';

import { newest, readRecordSync, recordFile, seedFolder } from './record.ts';
import type { CacheContext } from './types.ts';

export default function getCacheAsync<T>(this: CacheContext, endpoint: string): T | null {
  const seed = seedFolder(this);
  if (seed) {
    const record = newest<T>(readRecordSync<T>(this, this.cachePath, endpoint), readRecordSync<T>(this, seed, endpoint));
    return record ? record.body : null;
  }

  try {
    const contents = fs.readFileSync(recordFile(this, this.cachePath, endpoint), 'utf8');
    const record = JSON.parse(contents.toString());
    return record.body;
  } catch (_err) {
    return null;
  }
}
