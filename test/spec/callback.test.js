var assert = require('assert');
var path = require('path');
var access = require('fs-access-compat');
var rimraf = require('rimraf');

var Cache = require('../..');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

describe('callback', function () {
  beforeEach(function (done) {
    rimraf(TMP_DIR, done.bind(null, null));
  });

  describe('happy path', function () {
    it('works without new', function (done) {
      var cache = Cache(TMP_DIR);

      cache.get('https://jsonplaceholder.typicode.com/users', function (err, json) {
        assert.ok(!err);
        assert.ok(json.length > 0);

        access(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'), function (err) {
          assert.ok(!err);
          done();
        });
      });
    });

    it('get from clean', function (done) {
      var cache = new Cache(TMP_DIR);

      cache.get('https://jsonplaceholder.typicode.com/users', function (err, json) {
        assert.ok(!err);
        assert.ok(json.length > 0);

        access(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'), function (err) {
          assert.ok(!err);
          done();
        });
      });
    });

    it('get multiple times', function (done) {
      var cache = new Cache(TMP_DIR);

      cache.get('https://jsonplaceholder.typicode.com/users', function (err, json) {
        assert.ok(!err);
        assert.ok(json.length > 0);

        cache.get('https://jsonplaceholder.typicode.com/users', function (err, json) {
          assert.ok(!err);
          assert.ok(json.length > 0);

          access(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'), function (err) {
            assert.ok(!err);
            done();
          });
        });
      });
    });

    it('get forced', function (done) {
      var cache = new Cache(TMP_DIR);

      cache.get('https://jsonplaceholder.typicode.com/users', function (err, json) {
        assert.ok(!err);
        assert.ok(json.length > 0);

        // get with forced update
        cache.get('https://jsonplaceholder.typicode.com/users', { force: true }, function (err, json) {
          assert.ok(!err);
          assert.ok(json.length > 0);

          access(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'), function (err) {
            assert.ok(!err);
            done();
          });
        });
      });
    });

    it('clear an empty cache', function (done) {
      var cache = new Cache(TMP_DIR);

      // clear the cache
      cache.clear(function (err) {
        assert.ok(!err);
        done();
      });
    });

    it('clear an existing cache', function (done) {
      var cache = new Cache(TMP_DIR);

      cache.get('https://jsonplaceholder.typicode.com/users', function (err, json) {
        assert.ok(!err);
        assert.ok(json.length > 0);

        access(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'), function (err) {
          assert.ok(!err);

          // clear the cache
          cache.clear(function (err) {
            assert.ok(!err);

            access(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'), function (err) {
              assert.ok(err);
              done();
            });
          });
        });
      });
    });
  });

  describe('unhappy path', function () {
    it('missing cacheDirectory', function (done) {
      try {
        var cache = new Cache(TMP_DIR);
        assert.ok(!cache);
      } catch (err) {
        assert.ok(err);
        done();
      }
    });
  });
});
