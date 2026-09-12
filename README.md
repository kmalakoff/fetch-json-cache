# fetch-json-cache

Caches fetched JSON and updates it when the endpoint's ETag changes. If a
cached record exists, it reuses that record only when the ETag request fails
with `ENOTFOUND` or the legacy `SSL23_GET_SERVER_HELLO` error. Other errors
propagate, and `{ force: true }` bypasses this fallback.

```sh
npm install fetch-json-cache
```

```js
var Cache = require('fetch-json-cache');
var cache = new Cache('/path/to/cache');
var endpoint = 'https://registry.npmjs.org/fetch-json-cache';

async function run() {
  var json = await cache.get(endpoint);
  console.log(json.name);
  await cache.clear();
}

run().catch(console.error);
```

Pass `{ force: true }` as the second argument to fetch and replace the cached value regardless of its ETag. Use `cache.getSync(endpoint)` to read an existing cached value without making a request.

Callback forms are also available:

```js
cache.get(endpoint, function (err, json) {
  if (err) return console.error(err);
  console.log(json.name);
});
```

Pass a `transform` function in the constructor options to change the parsed JSON before it is stored.
