var fs = require('fs');
var path = require('path');

module.exports = function getCacheAsync(endpoint) {
  var fullPath = path.join(this.cacheDirectory, this.options.hash(endpoint) + '.json');
  try {
    var contents = fs.readFileSync(fullPath, 'utf8');
    var record = JSON.parse(contents.toString());
    return record.body;
  } catch (err) {
    return null;
  }
};
