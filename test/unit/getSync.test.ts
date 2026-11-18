import assert from 'assert';
import Cache from 'fetch-json-cache';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import url from 'url';

import { existsSync } from '../lib/compat.ts';

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

      cache.get<DistTagsJSON>('https://registry.npmjs.org/-/package/npm/dist-tags', (err, json): void => {
        if (err) return done(err);
        assert.ok(json?.latest);
        assert.equal(existsSync(path.join(TMP_DIR, `${cache.options.hash?.('https://registry.npmjs.org/-/package/npm/dist-tags')}.json`)), true);
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

  describe('seedPath', () => {
    const SEED_DIR = path.join(TMP_DIR, 'seed');
    const CACHE_DIR = path.join(TMP_DIR, 'cache');
    const ENDPOINT = 'http://127.0.0.1:9/data';

    function write(dir: string, body: unknown, headers: object | string | null) {
      mkdirp.sync(dir);
      const file = path.join(dir, `${new Cache(dir).options.hash?.(ENDPOINT)}.json`);
      fs.writeFileSync(file, typeof headers === 'string' ? headers : JSON.stringify({ headers: headers || {}, body }), 'utf8');
    }
    const at = (date: string, age?: number) => (age === undefined ? { date } : { date, age: String(age) });

    it('the newer seed wins over cachePath', () => {
      write(CACHE_DIR, 'cache', at('Mon, 01 Jan 2024 00:00:00 GMT'));
      write(SEED_DIR, 'seed', at('Tue, 02 Jan 2024 00:00:00 GMT'));
      assert.equal(new Cache(CACHE_DIR, { seedPath: SEED_DIR }).getSync(ENDPOINT), 'seed');
    });

    it('the newer cachePath wins over the seed', () => {
      write(CACHE_DIR, 'cache', at('Tue, 02 Jan 2024 00:00:00 GMT'));
      write(SEED_DIR, 'seed', at('Mon, 01 Jan 2024 00:00:00 GMT'));
      assert.equal(new Cache(CACHE_DIR, { seedPath: SEED_DIR }).getSync(ENDPOINT), 'cache');
    });

    it('a tie goes to cachePath', () => {
      write(CACHE_DIR, 'cache', at('Mon, 01 Jan 2024 00:00:00 GMT'));
      write(SEED_DIR, 'seed', at('Mon, 01 Jan 2024 00:00:00 GMT'));
      assert.equal(new Cache(CACHE_DIR, { seedPath: SEED_DIR }).getSync(ENDPOINT), 'cache');
    });

    it('age is subtracted from date', () => {
      // the cache record is the later date but was already 2 days old when sent
      write(CACHE_DIR, 'cache', at('Tue, 02 Jan 2024 00:00:00 GMT', 172800));
      write(SEED_DIR, 'seed', at('Mon, 01 Jan 2024 00:00:00 GMT'));
      assert.equal(new Cache(CACHE_DIR, { seedPath: SEED_DIR }).getSync(ENDPOINT), 'seed');
    });

    it('a missing date counts as 0', () => {
      write(CACHE_DIR, 'cache', {});
      write(SEED_DIR, 'seed', at('Mon, 01 Jan 2024 00:00:00 GMT'));
      assert.equal(new Cache(CACHE_DIR, { seedPath: SEED_DIR }).getSync(ENDPOINT), 'seed');
    });

    it('a corrupt cachePath record falls through to the seed', () => {
      write(CACHE_DIR, null, '{"headers":{"date":"Tue, 02 Jan 2024 00:00:00 GMT"},"bod');
      write(SEED_DIR, 'seed', at('Mon, 01 Jan 2024 00:00:00 GMT'));
      assert.equal(new Cache(CACHE_DIR, { seedPath: SEED_DIR }).getSync(ENDPOINT), 'seed');
    });

    it('a missing cachePath record falls through to the seed', () => {
      write(SEED_DIR, 'seed', at('Mon, 01 Jan 2024 00:00:00 GMT'));
      assert.equal(new Cache(CACHE_DIR, { seedPath: SEED_DIR }).getSync(ENDPOINT), 'seed');
    });

    it('a corrupt seed record falls through to cachePath', () => {
      write(CACHE_DIR, 'cache', at('Mon, 01 Jan 2024 00:00:00 GMT'));
      write(SEED_DIR, null, 'not json');
      assert.equal(new Cache(CACHE_DIR, { seedPath: SEED_DIR }).getSync(ENDPOINT), 'cache');
    });

    it('null when neither has a record', () => {
      assert.equal(new Cache(CACHE_DIR, { seedPath: SEED_DIR }).getSync(ENDPOINT), null);
    });
  });
});
