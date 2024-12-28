import assert from 'assert';
import path from 'path';
import url from 'url';
import existsSync from 'fs-exists-sync';
import rimraf2 from 'rimraf2';

// @ts-ignore
import Cache from 'fetch-json-cache';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

interface DistTagsJSON {
  latest: string;
}

describe('callback', () => {
  beforeEach((cb) => rimraf2(TMP_DIR, { disableGlob: true }, cb.bind(null, null)));

  describe('happy path', () => {
    it('get from clean', (done) => {
      const cache = new Cache(TMP_DIR);

      cache.get('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json) => {
        assert.ok(!err, err ? err.message : '');
        assert.ok((json as DistTagsJSON).latest);
        assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), true);
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
          assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), true);
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
          assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), true);
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
        assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), true);

        // clear the cache
        cache.clear((err) => {
          assert.ok(!err, err ? err.message : '');
          assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), false);
          done();
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
