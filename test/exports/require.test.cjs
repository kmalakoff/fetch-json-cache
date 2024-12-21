const assert = require('assert');
const Cache = require('fetch-json-cache');

describe('exports .cjs', () => {
  it('can create', () => {
    assert.equal(typeof Cache, 'function');
    const cache = new Cache('CACHE_DIR');
    assert.equal(typeof cache.get, 'function');
  });
});
