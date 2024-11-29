const assert = require('assert');
const path = require('path');
const accessSync = require('fs-access-sync-compat');
const rimraf2 = require('rimraf2');

const Cache = require('fetch-json-cache');

const TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

describe('sync', () => {
  beforeEach((done) => {
    rimraf2(TMP_DIR, { disableGlob: true }, done.bind(null, null));
  });

  describe('happy path', () => {
    it('get from clean', (done) => {
      const cache = new Cache(TMP_DIR);

      cache.get('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json) => {
        assert.ok(!err);
        assert.ok(json.latest);

        assert.doesNotThrow(() => {
          accessSync(path.join(TMP_DIR, `${cache.options.hash('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`));
        });
        assert.doesNotThrow(() => {
          const data = cache.getSync('https://registry.npmjs.org/-/package/npm/dist-tags');
          assert.ok(data);
        });

        done();
      });
    });

    it('returns null for missing data', () => {
      const cache = new Cache(TMP_DIR);

      assert.doesNotThrow(() => {
        const data = cache.getSync('https://registry.npmjs.org/-/package/npm/dist-tags');
        assert.equal(data, null);
      });
    });
  });
});
