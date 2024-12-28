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

describe('sync', () => {
  beforeEach((cb) => rimraf2(TMP_DIR, { disableGlob: true }, cb.bind(null, null)));

  describe('happy path', () => {
    it('get from clean', (done) => {
      const cache = new Cache(TMP_DIR);

      cache.get('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json) => {
        assert.ok(!err, err ? err.message : '');
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
