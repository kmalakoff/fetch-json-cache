## fetch-json-cache

Caches fetched json. Updates when etag changes and is uses cache regardless if endpoint unreachable. Uses write-file-atomic for safe updates.

```
var Cache = require('fetch-json-cache');
var assert = require('assert');

var cache = new Cache('/path/to/cache');

//////////////
// callbacks
//////////////

// get
cache.get('https://jsonplaceholder.typicode.com/users', function(err, json) {
  assert.ok(json.length > 0);
})

// get with forced update
cache.get('https://jsonplaceholder.typicode.com/users', { force: true }, function(err, json) {
  assert.ok(json.length > 0);
})

// clear the cache
cache.clear(function(err) {
})

//////////////
// promise
//////////////

// get
var json = await cache.get('https://jsonplaceholder.typicode.com/users')
assert.ok(json.length > 0);

// get with forced update
var json2 = await cache.get('https://jsonplaceholder.typicode.com/users', { force: true })
assert.ok(json2.length > 0);

// clear the cache
await cache.clear()
```
