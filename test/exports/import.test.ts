import assert from 'assert';
// @ts-ignore
import Cache, { type Options } from 'fetch-json-cache';

describe('exports .ts', () => {
  it('can create', () => {
    assert.equal(typeof Cache, 'function');
    const cache = new Cache('CACHE_DIR');
    assert.equal(typeof cache.get, 'function');
  });
});
