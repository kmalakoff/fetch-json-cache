var assert = require('assert');
var path = require('path');
var accessSync = require('fs-access-sync-compat');
var rimraf = require('rimraf');

var Cache = require('../../lib');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

describe('sync', function () {
  beforeEach(function (done) {
    rimraf(TMP_DIR, done.bind(null, null));
  });

  describe('happy path', function () {
    it('get from clean', function (done) {
      var cache = new Cache(TMP_DIR);

      cache.get('https://jsonplaceholder.typicode.com/users', function (err, json) {
        assert.ok(!err);
        assert.ok(json.length > 0);

        assert.doesNotThrow(function () {
          accessSync(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'));
        });
        assert.doesNotThrow(function () {
          var data = cache.getSync('https://jsonplaceholder.typicode.com/users');
          assert.ok(data);
        });

        done();
      });
    });

    it('returns null for missing data', function () {
      var cache = new Cache(TMP_DIR);

      assert.doesNotThrow(function () {
        var data = cache.getSync('https://jsonplaceholder.typicode.com/users');
        assert.equal(data, null);
      });
    });
  });
});
