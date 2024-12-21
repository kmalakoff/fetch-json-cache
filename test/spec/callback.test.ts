import assert from 'assert';
import path from 'path';
import url from 'url';
import accessSync from 'fs-access-sync-compat';
import rimraf2 from 'rimraf2';

// @ts-ignore
import Cache from 'fetch-json-cache';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

interface DistTagsJSON {
  latest: string;
}

describe('callback', () => {
  beforeEach((done) => {
    rimraf2(TMP_DIR, { disableGlob: true }, done.bind(null, null));
  });

  describe('happy path', () => {
    it('get from clean', (done) => {
      const cache = new Cache(TMP_DIR);

      cache.get('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json) => {
        assert.ok(!err, err ? err.message : '');
        assert.ok((json as DistTagsJSON).latest);

        assert.doesNotThrow(() => {
          accessSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`));
        });
        done();
      });
    });

    it('get multiple times', (done) => {
      const cache = new Cache(TMP_DIR);

      cache.get('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json) => {
        assert.ok(!err, err ? err.message : '');
        assert.ok((json as DistTagsJSON).latest);

        cache.get('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json) => {
          assert.ok(!err, err ? err.message : '');
          assert.ok((json as DistTagsJSON).latest);

          assert.doesNotThrow(() => {
            accessSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`));
          });
          done();
        });
      });
    });

    it('get forced', (done) => {
      const cache = new Cache(TMP_DIR);

      cache.get('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json) => {
        assert.ok(!err, err ? err.message : '');
        assert.ok((json as DistTagsJSON).latest);

        // get with forced update
        cache.get('https://registry.npmjs.org/-/package/npm/dist-tags', { force: true }, (err, json) => {
          assert.ok(!err, err ? err.message : '');
          assert.ok((json as DistTagsJSON).latest);

          assert.doesNotThrow(() => {
            accessSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`));
          });
          done();
        });
      });
    });

    it('clear an empty cache', (done) => {
      const cache = new Cache(TMP_DIR);

      // clear the cache
      cache.clear((err) => {
        assert.ok(!err, err ? err.message : '');
        done();
      });
    });

    it('clear an existing cache', (done) => {
      const cache = new Cache(TMP_DIR);

      cache.get('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json) => {
        assert.ok(!err, err ? err.message : '');
        assert.ok((json as DistTagsJSON).latest);

        assert.doesNotThrow(() => {
          accessSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`));
        });

        // clear the cache
        cache.clear((err) => {
          assert.ok(!err, err ? err.message : '');

          try {
            accessSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`));
            assert.ok(false);
          } catch (err) {
            assert.ok(err);
            done();
          }
        });
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
