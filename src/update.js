const path = require('path');
const get = require('get-remote');
const mkpath = require('mkpath');
const writeFile = require('write-file-atomic');

module.exports = function update(endpoint, callback) {
  const fullPath = path.join(this.cacheDirectory, `${this.options.hash(endpoint)}.json`);

  mkpath(this.cacheDirectory, (err) => {
    if (err && err.code !== 'EEXIST') return callback(err);

    get(endpoint).json((err, res) => {
      if (err) return callback(err);

      const record = { headers: res.headers, body: res.body };
      writeFile(fullPath, JSON.stringify(record), 'utf8', (err) => {
        err ? callback(err) : callback(null, record.body);
      });
    });
  });
};
