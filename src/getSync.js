const fs = require('fs');
const path = require('path');

module.exports = function getCacheAsync(endpoint) {
  const fullPath = path.join(this.cacheDirectory, `${this.options.hash(endpoint)}.json`);
  try {
    const contents = fs.readFileSync(fullPath, 'utf8');
    const record = JSON.parse(contents.toString());
    return record.body;
  } catch (_err) {
    return null;
  }
};
