import fs from 'fs';
import path from 'path';

export default function getCacheAsync(endpoint) {
  const fullPath = path.join(this.cachePath, `${this.options.hash(endpoint)}.json`);
  try {
    const contents = fs.readFileSync(fullPath, 'utf8');
    const record = JSON.parse(contents.toString());
    return record.body;
  } catch (_err) {
    return null;
  }
}
