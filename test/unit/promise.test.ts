import assert from 'assert';
import Cache from 'fetch-json-cache';
import existsSync from 'fs-exists-sync';
import { safeRm } from 'fs-remove-compat';
import path from 'path';
import Pinkie from 'pinkie-promise';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.join(path.join(__dirname, '..', '..', '.tmp'));

interface DistTagsJSON {
  latest: string;
}

describe('promise', () => {
  (() => {
    // patch and restore promise
    if (typeof global === 'undefined') return;
    const globalPromise = global.Promise;
    before(() => {
      global.Promise = Pinkie;
    });
    after(() => {
      global.Promise = globalPromise;
    });
  })();

  beforeEach((cb) => safeRm(TMP_DIR, cb));

  describe('happy path', () => {
    it('get from clean', (done) => {
      const cache = new Cache(TMP_DIR);

      cache
        .get('https://registry.npmjs.org/-/package/npm/dist-tags')
        .then((json) => {
          assert.ok((json as DistTagsJSON).latest);
          assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), true);
          done();
        })
        .catch((err) => {
          if (err) {
            done(err);
            return;
          }
        });
    });

    it('get multiple times', (done) => {
      const cache = new Cache(TMP_DIR);

      cache
        .get('https://registry.npmjs.org/-/package/npm/dist-tags')
        .then((json) => {
          assert.ok((json as DistTagsJSON).latest);

          cache
            .get('https://registry.npmjs.org/-/package/npm/dist-tags')
            .then((json) => {
              assert.ok((json as DistTagsJSON).latest);
              assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), true);

              done();
            })
            .catch((err) => {
              if (err) {
                done(err);
                return;
              }
            });
        })
        .catch((err) => {
          if (err) {
            done(err);
            return;
          }
        });
    });

    it('get forced', (done) => {
      const cache = new Cache(TMP_DIR);

      cache
        .get('https://registry.npmjs.org/-/package/npm/dist-tags')
        .then((json) => {
          assert.ok((json as DistTagsJSON).latest);

          cache
            .get('https://registry.npmjs.org/-/package/npm/dist-tags', { force: true })
            .then((json) => {
              assert.ok((json as DistTagsJSON).latest);
              assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), true);
              done();
            })
            .catch((err) => {
              if (err) {
                done(err);
                return;
              }
            });
        })
        .catch((err) => {
          if (err) {
            done(err);
            return;
          }
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
          if (err) {
            done(err);
            return;
          }
        });
    });

    it('clear an existing cache', (done) => {
      const cache = new Cache(TMP_DIR);

      cache
        .get('https://registry.npmjs.org/-/package/npm/dist-tags')
        .then((json) => {
          assert.ok((json as DistTagsJSON).latest);
          assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), true);

          // clear the cache
          cache
            .clear()
            .then(() => {
              assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), false);
              done();
            })
            .catch((err) => {
              if (err) {
                done(err);
                return;
              }
            });
        })
        .catch((err) => {
          if (err) {
            done(err);
            return;
          }
        });
    });
  });

  describe('unhappy path', () => {
    it('missing cachePath', (done) => {
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
