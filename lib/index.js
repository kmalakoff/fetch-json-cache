var rimraf = require('rimraf');

var get = require('./get');
var hash = require('./hash');
var update = require('./update');

function Cache(cacheDirectory, options) {
  if (!(this instanceof Cache)) return new Cache(cacheDirectory, options);
  if (!cacheDirectory) throw new Error('Cache needs cacheDirectory');
  this.cacheDirectory = cacheDirectory;
  this.options = typeof options === 'undefined' ? {} : options;
  if (!this.options.hash) this.options.hash = hash;
}

Cache.prototype.get = function (endpoint, options, callback) {
  var self = this;
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};

  if (typeof callback === 'function') return options.force ? update.call(this, endpoint, callback) : get.call(this, endpoint, callback);
  return new Promise(function (resolve, reject) {
    self.get(endpoint, options, function (err, json) {
      err ? reject(err) : resolve(json);
    });
  });
};

Cache.prototype.clear = function (callback) {
  var self = this;
  if (typeof callback === 'function')
    return rimraf(this.cacheDirectory, function (err) {
      err = null; // ignore errors since it is fine to delete a directory that doesn't exist from a cache standpoint
      callback();
    });
  return new Promise(function (resolve, reject) {
    self.clear(function (err, json) {
      err ? reject(err) : resolve(json);
    });
  });
};

module.exports = Cache;
