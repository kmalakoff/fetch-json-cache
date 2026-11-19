# Changelog

All notable changes to fetch-json-cache are documented here.

## [1.9.1] - 2026-11-18

### Fixed

- A file where the cache folder (or one of its parents) should be now fails `get` right away with an `ENOTDIR` error whose message and `path` name that file. Before, the fetch went ahead and the write failed later with a misleading error.

## [1.9.0] - 2026-11-18

### Added

- `seedPath` option: a read-only folder of records. `get` and `getSync` use the record that was fetched later, `cachePath` winning a tie, and `get` still refreshes only into `cachePath`. `clear()` never touches `seedPath`. Without the option nothing changes.

## [1.8.0]

### Fixed

- A cache record that cannot be read back (a corrupt or truncated file, or JSON that is not a record) is treated as a miss and refreshed from the endpoint. Before, `get` threw an uncaught exception from inside a callback.
- An endpoint that sends no `etag` is no longer treated as unchanged. Before, a cached copy of such an endpoint was never refreshed after the first fetch; now every `get` re-fetches it, because there is nothing to compare. Endpoints that send an etag behave as before.

### Changed

- The final rename of a cache record into place is done by the `staged-cache` package (now a dependency) instead of a copy inside this package. A refused rename still counts as a lost race only when a file is at the destination. If the leftover temporary file cannot then be removed, the update now reports that error instead of ignoring it.
