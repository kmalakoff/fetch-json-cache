var assert = require('assert');
var path = require('path');
var accessSync = require('fs-access-sync-compat');
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

        assert.doesNotThrow(function () {
          accessSync(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'));
        });
        done();
      });
    });

    it('get from clean', function (done) {
      var cache = new Cache(TMP_DIR);

      cache.get('https://jsonplaceholder.typicode.com/users', function (err, json) {
        assert.ok(!err);
        assert.ok(json.length > 0);

        assert.doesNotThrow(function () {
          accessSync(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'));
        });
        done();
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

          assert.doesNotThrow(function () {
            accessSync(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'));
          });
          done();
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

          assert.doesNotThrow(function () {
            accessSync(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'));
          });
          done();
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

        assert.doesNotThrow(function () {
          accessSync(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'));
        });

        // clear the cache
        cache.clear(function (err) {
          assert.ok(!err);

          try {
            accessSync(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'));
            assert.ok(false);
          } catch (err) {
            assert.ok(err);
            done();
          }
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
