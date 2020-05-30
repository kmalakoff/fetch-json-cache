var path = require('path');
var writeFile = require('write-file-atomic');
var mkpath = require('mkpath');

var fetch = require('./fetch');

module.exports = function update(endpoint, callback) {
  var self = this;
  var fullPath = path.join(this.cacheDirectory, this.options.hash(endpoint) + '.json');
  fetch(endpoint, function (err, record) {
    if (err) return callback(err);

    mkpath(self.cacheDirectory, function (err) {
      if (err && err.code !== 'EEXIST') return callback(err);

      writeFile(fullPath, JSON.stringify(record), 'utf8', function (err) {
        err ? callback(err) : callback(null, record.body);
      });
    });
  });
};
