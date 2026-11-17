# fetch-json-cache

Caches fetched JSON and updates it when the endpoint's ETag changes. If a
cached record exists and the ETag request fails for any reason (server down,
host not found, timeout), it returns the cached copy instead of an error; with
no cached record the error propagates. The ETag request waits 10 seconds at most.
`{ force: true }` bypasses this fallback.

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
