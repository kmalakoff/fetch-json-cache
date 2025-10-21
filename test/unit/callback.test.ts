import assert from 'assert';
import Cache from 'fetch-json-cache';
import existsSync from 'fs-exists-sync';
import path from 'path';
import rimraf2 from 'rimraf2';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.join(path.join(__dirname, '..', '..', '.tmp'));

interface DistTagsJSON {
  latest: string;
}

describe('callback', () => {
  beforeEach(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));

  describe('happy path', () => {
    it('get from clean', (done) => {
      const cache = new Cache(TMP_DIR);

      cache.get<DistTagsJSON>('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json): undefined => {
        if (err) {
          done(err.message);
          return;
        }
        assert.ok(json.latest);
        assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), true);
        done();
      });
    });

    it('get multiple times', (done) => {
      const cache = new Cache(TMP_DIR);

      cache.get<DistTagsJSON>('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json) => {
        if (err) {
          done(err.message);
          return;
        }
        assert.ok(json.latest);

        cache.get<DistTagsJSON>('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json) => {
          if (err) {
            done(err.message);
            return;
          }
          assert.ok(json.latest);
          assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), true);
          done();
        });
      });
    });

    it('get forced', (done) => {
      const cache = new Cache(TMP_DIR);

      cache.get<DistTagsJSON>('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json) => {
        if (err) {
          done(err.message);
          return;
        }
        assert.ok(json.latest);

        // get with forced update
        cache.get<DistTagsJSON>('https://registry.npmjs.org/-/package/npm/dist-tags', { force: true }, (err, json) => {
          if (err) {
            done(err.message);
            return;
          }
          assert.ok(json.latest);
          assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), true);
          done();
        });
      });
    });

    it('clear an empty cache', (done) => {
      const cache = new Cache(TMP_DIR);
      // clear the cache
      cache.clear((err) => {
        if (err) {
          done(err.message);
          return;
        }
        done();
      });
    });

    it('clear an existing cache', (done) => {
      const cache = new Cache(TMP_DIR);

      cache.get<DistTagsJSON>('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json) => {
        if (err) {
          done(err.message);
          return;
        }
        assert.ok(json.latest);
        assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), true);

        // clear the cache
        cache.clear((err) => {
          if (err) {
            done(err.message);
            return;
          }
          assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), false);
          done();
        });
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
