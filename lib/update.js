var path = require('path');
var get = require('get-remote');
var mkpath = require('mkpath');
var writeFile = require('write-file-atomic');

module.exports = function update(endpoint, callback) {
  var fullPath = path.join(this.cacheDirectory, this.options.hash(endpoint) + '.json');

  mkpath(this.cacheDirectory, function (err) {
    if (err && err.code !== 'EEXIST') return callback(err);

    get(endpoint).json(function (err, res) {
      if (err) return callback(err);

      var record = { headers: res.headers, body: res.body };
      writeFile(fullPath, JSON.stringify(record), 'utf8', function (err) {
        err ? callback(err) : callback(null, record.body);
      });
    });
  });
};
