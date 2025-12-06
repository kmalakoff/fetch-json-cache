import assert from 'assert';
import Cache from 'fetch-json-cache';
import existsSync from 'fs-exists-sync';
import { safeRm } from 'fs-remove-compat';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.join(path.join(__dirname, '..', '..', '.tmp'));

interface DistTagsJSON {
  latest: string;
}

describe('sync', () => {
  beforeEach((cb) => safeRm(TMP_DIR, cb));

  describe('happy path', () => {
    it('get from clean', (done) => {
      const cache = new Cache(TMP_DIR);

      cache.get<DistTagsJSON>('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json): undefined => {
        if (err) {
          done(err);
          return;
        }
        assert.ok(json.latest);
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
