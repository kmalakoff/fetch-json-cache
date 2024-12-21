import assert from 'assert';
import Cache from 'fetch-json-cache';

describe('exports .mjs', () => {
  it('can create', () => {
    assert.equal(typeof Cache, 'function');
    const cache = new Cache('CACHE_DIR');
    assert.equal(typeof cache.get, 'function');
  });
});
