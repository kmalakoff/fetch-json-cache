import assert from 'assert';
import Cache from 'fetch-json-cache';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import url from 'url';

import { existsSync } from '../lib/compat.ts';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, '..', '..', '.tmp', 'Cache');
const SEED_DIR = path.join(TMP_DIR, 'seed');
const CACHE_DIR = path.join(TMP_DIR, 'cache');

describe('Cache', () => {
  beforeEach((cb) => {
    safeRm(TMP_DIR, () => {
      mkdirp.sync(SEED_DIR);
      mkdirp.sync(CACHE_DIR);
      fs.writeFileSync(path.join(SEED_DIR, 'seed.json'), '{}', 'utf8');
      fs.writeFileSync(path.join(CACHE_DIR, 'cache.json'), '{}', 'utf8');
      cb();
    });
  });

  it('throws without a cachePath', () => {
    assert.throws(() => new Cache(undefined as unknown as string));
  });

  it('clear removes cachePath and leaves seedPath alone', (done) => {
    new Cache(CACHE_DIR, { seedPath: SEED_DIR }).clear((err) => {
      if (err) return done(err);
      assert.equal(existsSync(CACHE_DIR), false);
      assert.equal(existsSync(path.join(SEED_DIR, 'seed.json')), true);
      done();
    });
  });

  it('a seedPath equal to cachePath behaves like no seed', () => {
    const endpoint = 'http://127.0.0.1:9/data';
    const plain = new Cache(CACHE_DIR);
    const file = path.join(CACHE_DIR, `${plain.options.hash?.(endpoint)}.json`);
    fs.writeFileSync(file, JSON.stringify({ body: 'same' }), 'utf8');
    assert.equal(new Cache(CACHE_DIR, { seedPath: CACHE_DIR }).getSync(endpoint), 'same');
    assert.equal(new Cache(CACHE_DIR, { seedPath: path.join(CACHE_DIR, '..', 'cache') }).getSync(endpoint), 'same');
  });
});
