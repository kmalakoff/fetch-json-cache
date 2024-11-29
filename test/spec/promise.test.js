const assert = require('assert');
const path = require('path');
const accessSync = require('fs-access-sync-compat');
const rimraf2 = require('rimraf2');

const Cache = require('fetch-json-cache');

const TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

describe('promise', () => {
  beforeEach((done) => {
    rimraf2(TMP_DIR, { disableGlob: true }, done.bind(null, null));
  });

  describe('happy path', () => {
    it('get from clean', (done) => {
      const cache = new Cache(TMP_DIR);

      cache
        .get('https://registry.npmjs.org/-/package/npm/dist-tags')
        .then((json) => {
          assert.ok(json.latest);

          assert.doesNotThrow(() => {
            accessSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`));
          });
          done();
        })
        .catch((err) => {
          assert.ok(!err);
        });
    });

    it('get multiple times', (done) => {
      const cache = new Cache(TMP_DIR);

      cache
        .get('https://registry.npmjs.org/-/package/npm/dist-tags')
        .then((json) => {
          assert.ok(json.latest);

          cache
            .get('https://registry.npmjs.org/-/package/npm/dist-tags')
            .then((json) => {
              assert.ok(json.latest);

              assert.doesNotThrow(() => {
                accessSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`));
              });
              done();
            })
            .catch((err) => {
              assert.ok(!err);
            });
        })
        .catch((err) => {
          assert.ok(!err);
        });
    });

    it('get forced', (done) => {
      const cache = new Cache(TMP_DIR);

      cache
        .get('https://registry.npmjs.org/-/package/npm/dist-tags')
        .then((json) => {
          assert.ok(json.latest);

          cache
            .get('https://registry.npmjs.org/-/package/npm/dist-tags', { force: true })
            .then((json) => {
              assert.ok(json.latest);

              assert.doesNotThrow(() => {
                accessSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`));
              });
              done();
            })
            .catch((err) => {
              assert.ok(!err);
            });
        })
        .catch((err) => {
          assert.ok(!err);
        });
    });

    it('clear an empty cache', (done) => {
      const cache = new Cache(TMP_DIR);

      // clear the cache
      cache
        .clear()
        .then(() => {
          done();
        })
        .catch((err) => {
          assert.ok(!err);
        });
    });

    it('clear an existing cache', (done) => {
      const cache = new Cache(TMP_DIR);

      cache
        .get('https://registry.npmjs.org/-/package/npm/dist-tags')
        .then((json) => {
          assert.ok(json.latest);

          assert.doesNotThrow(() => {
            accessSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`));
          });

          // clear the cache
          cache
            .clear()
            .then(() => {
              try {
                accessSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`));
                assert.ok(false);
              } catch (err) {
                assert.ok(err);
                done();
              }
            })
            .catch((err) => {
              assert.ok(!err);
            });
        })
        .catch((err) => {
          assert.ok(!err);
        });
    });
  });

  describe('unhappy path', () => {
    it('missing cacheDirectory', (done) => {
      try {
        const cache = new Cache(TMP_DIR);
        assert.ok(!cache);
      } catch (err) {
        assert.ok(err);
        done();
      }
    });
  });
});
