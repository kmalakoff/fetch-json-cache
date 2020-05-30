var crypto = require('crypto');

module.exports = function hash(data) {
  return crypto.createHash('md5').update(data).digest('hex');
};
