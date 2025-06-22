import assert from 'assert';
// @ts-ignore
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

describe('sync', () => {
  beforeEach(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));

  describe('happy path', () => {
    it('get from clean', (done) => {
      const cache = new Cache(TMP_DIR);

      cache.get('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json) => {
        if (err) return done(err.message);
        assert.ok((json as DistTagsJSON).latest);
        assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), true);
        assert.doesNotThrow(() => {
          const data = cache.getSync('https://registry.npmjs.org/-/package/npm/dist-tags');
          assert.ok(data);
        });

        done();
      });
    });

    it('returns null for missing data', () => {
      const cache = new Cache(TMP_DIR);
      const data = cache.getSync('https://registry.npmjs.org/-/package/npm/dist-tags');
      assert.equal(data, null);
    });
  });
});
