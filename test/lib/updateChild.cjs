// Child process for test/unit/update.test.ts: force-updates one endpoint repeatedly.
// usage: node updateChild.cjs <cachePath> <endpoint> <count>
var Cache = require('fetch-json-cache');
var cache = new Cache(process.argv[2]);
var endpoint = process.argv[3];
var remaining = +process.argv[4];

function next() {
  if (remaining-- <= 0) return;
  cache.get(endpoint, { force: true }, function (err) {
    if (err) {
      console.error(err.message);
      process.exit(1);
    }
    next();
  });
}
next();
