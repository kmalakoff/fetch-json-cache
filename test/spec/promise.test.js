var assert = require('assert');
var path = require('path');
var access = require('fs-access-compat');
var rimraf = require('rimraf');

var Cache = require('../..');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

describe('promise', function () {
  if (typeof Promise === 'undefined') return;

  beforeEach(function (done) {
    rimraf(TMP_DIR, done.bind(null, null));
  });

  describe('happy path', function () {
    it('works without new', function (done) {
      var cache = Cache(TMP_DIR);

      cache
        .get('https://jsonplaceholder.typicode.com/users')
        .then(function (json) {
          assert.ok(json.length > 0);

          access(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'), function (err) {
            assert.ok(!err);
            done();
          });
        })
        .catch(function (err) {
          assert.ok(!err);
        });
    });

    it('get from clean', function (done) {
      var cache = new Cache(TMP_DIR);

      cache
        .get('https://jsonplaceholder.typicode.com/users')
        .then(function (json) {
          assert.ok(json.length > 0);

          access(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'), function (err) {
            assert.ok(!err);
            done();
          });
        })
        .catch(function (err) {
          assert.ok(!err);
        });
    });

    it('get multiple times', function (done) {
      var cache = new Cache(TMP_DIR);

      cache
        .get('https://jsonplaceholder.typicode.com/users')
        .then(function (json) {
          assert.ok(json.length > 0);

          cache
            .get('https://jsonplaceholder.typicode.com/users')
            .then(function (json) {
              assert.ok(json.length > 0);

              access(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'), function (err) {
                assert.ok(!err);
                done();
              });
            })
            .catch(function (err) {
              assert.ok(!err);
            });
        })
        .catch(function (err) {
          assert.ok(!err);
        });
    });

    it('get forced', function (done) {
      var cache = new Cache(TMP_DIR);

      cache
        .get('https://jsonplaceholder.typicode.com/users')
        .then(function (json) {
          assert.ok(json.length > 0);

          cache
            .get('https://jsonplaceholder.typicode.com/users', { force: true })
            .then(function (json) {
              assert.ok(json.length > 0);

              access(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'), function (err) {
                assert.ok(!err);
                done();
              });
            })
            .catch(function (err) {
              assert.ok(!err);
            });
        })
        .catch(function (err) {
          assert.ok(!err);
        });
    });

    it('clear an empty cache', function (done) {
      var cache = new Cache(TMP_DIR);

      // clear the cache
      cache
        .clear()
        .then(function () {
          done();
        })
        .catch(function (err) {
          assert.ok(!err);
        });
    });

    it('clear an existing cache', function (done) {
      var cache = new Cache(TMP_DIR);

      cache
        .get('https://jsonplaceholder.typicode.com/users')
        .then(function (json) {
          assert.ok(json.length > 0);

          access(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'), function (err) {
            assert.ok(!err);

            // clear the cache
            cache
              .clear()
              .then(function () {
                access(path.join(TMP_DIR, cache.options.hash('https://jsonplaceholder.typicode.com/users') + '.json'), function (err) {
                  assert.ok(err);
                  done();
                });
              })
              .catch(function (err) {
                assert.ok(!err);
              });
          });
        })
        .catch(function (err) {
          assert.ok(!err);
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
