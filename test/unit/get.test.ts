import assert from 'assert';
import Cache from 'fetch-json-cache';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import http from 'http';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import url from 'url';

import { existsSync } from '../lib/compat.ts';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, '..', '..', '.tmp', 'get');

// node 0.x fetches through a blocking child process, so it cannot answer a server hosted in its own process
const major = +process.versions.node.split('.')[0];
(major === 0 ? describe.skip : describe)('get', () => {
  let server: http.Server;
  let endpoint: string;
  let version: number;
  let sendEtag: boolean;

  beforeEach((cb) => {
    version = 1;
    sendEtag = true;
    safeRm(TMP_DIR, () => {
      mkdirp.sync(TMP_DIR);
      server = http.createServer((req, res) => {
        res.writeHead(200, sendEtag ? { 'content-type': 'application/json', etag: `"v${version}"` } : { 'content-type': 'application/json' });
        res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ version }));
      });
      server.listen(0, '127.0.0.1', () => {
        endpoint = `http://127.0.0.1:${(server.address() as { port: number }).port}/data`;
        cb();
      });
    });
  });
  afterEach((cb) => server.close(() => cb()));

  describe('a record that cannot be read back', () => {
    const CORRUPT: Record<string, string> = {
      'not JSON': '{"headers":{"etag":"v1"},"bod',
      'empty file': '',
      'JSON without headers': '{"body":{"version":0}}',
      'JSON null': 'null',
    };

    Object.keys(CORRUPT).forEach((name) => {
      it(`${name} is a miss and is refreshed`, (done) => {
        const cache = new Cache(TMP_DIR);
        const file = path.join(TMP_DIR, `${cache.options.hash?.(endpoint)}.json`);
        fs.writeFileSync(file, CORRUPT[name], 'utf8');

        cache.get<{ version: number }>(endpoint, (err, json) => {
          if (err) return done(err);
          assert.deepEqual(json, { version: 1 });
          assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')).body, { version: 1 });
          done();
        });
      });
    });
  });

  describe('freshness check', () => {
    it('an unchanged etag returns the cached body', (done) => {
      const cache = new Cache(TMP_DIR);
      cache.get<{ version: number }>(endpoint, (err) => {
        if (err) return done(err);
        // the same etag on the server, a different body: only a refresh would show it
        const file = path.join(TMP_DIR, `${cache.options.hash?.(endpoint)}.json`);
        const record = JSON.parse(fs.readFileSync(file, 'utf8'));
        record.body = { version: 'cached' };
        fs.writeFileSync(file, JSON.stringify(record), 'utf8');

        cache.get<{ version: number | string }>(endpoint, (err, json) => {
          if (err) return done(err);
          assert.deepEqual(json, { version: 'cached' });
          done();
        });
      });
    });

    it('a changed etag refreshes the record', (done) => {
      const cache = new Cache(TMP_DIR);
      cache.get<{ version: number }>(endpoint, (err) => {
        if (err) return done(err);
        version = 2;
        cache.get<{ version: number }>(endpoint, (err, json) => {
          if (err) return done(err);
          assert.deepEqual(json, { version: 2 });
          done();
        });
      });
    });

    it('an endpoint that sends no etag is refreshed on every get', (done) => {
      sendEtag = false;
      const cache = new Cache(TMP_DIR);
      cache.get<{ version: number }>(endpoint, (err, json) => {
        if (err) return done(err);
        assert.deepEqual(json, { version: 1 });
        version = 2;
        cache.get<{ version: number }>(endpoint, (err, json) => {
          if (err) return done(err);
          assert.deepEqual(json, { version: 2 });
          done();
        });
      });
    });
  });

  describe('seedPath', () => {
    const SEED_DIR = path.join(TMP_DIR, 'seed');
    const CACHE_DIR = path.join(TMP_DIR, 'cache');
    const NEW = 'Tue, 02 Jan 2024 00:00:00 GMT';
    const OLD = 'Mon, 01 Jan 2024 00:00:00 GMT';

    function fileOf(dir: string): string {
      return path.join(dir, `${new Cache(dir).options.hash?.(endpoint)}.json`);
    }
    function write(dir: string, body: unknown, etag: string, date: string): string {
      mkdirp.sync(dir);
      const file = fileOf(dir);
      fs.writeFileSync(file, JSON.stringify({ headers: { etag, date }, body }), 'utf8');
      return file;
    }

    it('a seed with the same etag is returned and nothing is written', (done) => {
      const seedFile = write(SEED_DIR, { version: 'seed' }, '"v1"', NEW);
      const before = fs.readFileSync(seedFile, 'utf8');
      const cache = new Cache(CACHE_DIR, { seedPath: SEED_DIR });
      cache.get(endpoint, (err, json) => {
        if (err) return done(err);
        assert.deepEqual(json, { version: 'seed' });
        assert.equal(existsSync(CACHE_DIR), false);
        assert.equal(fs.readFileSync(seedFile, 'utf8'), before);
        done();
      });
    });

    it('a seed with a changed etag refreshes into cachePath and the seed is unchanged', (done) => {
      const seedFile = write(SEED_DIR, { version: 'seed' }, '"v0"', NEW);
      const before = fs.readFileSync(seedFile, 'utf8');
      const cache = new Cache(CACHE_DIR, { seedPath: SEED_DIR });
      cache.get(endpoint, (err, json) => {
        if (err) return done(err);
        assert.deepEqual(json, { version: 1 });
        assert.deepEqual(JSON.parse(fs.readFileSync(fileOf(CACHE_DIR), 'utf8')).body, { version: 1 });
        assert.equal(fs.readFileSync(seedFile, 'utf8'), before);
        done();
      });
    });

    it('a newer cachePath record wins over an older seed', (done) => {
      write(SEED_DIR, { version: 'seed' }, '"v1"', OLD);
      write(CACHE_DIR, { version: 'cache' }, '"v1"', NEW);
      new Cache(CACHE_DIR, { seedPath: SEED_DIR }).get(endpoint, (err, json) => {
        if (err) return done(err);
        assert.deepEqual(json, { version: 'cache' });
        done();
      });
    });

    it('with the server closed the newer seed is returned', (done) => {
      write(SEED_DIR, { version: 'seed' }, '"v1"', NEW);
      write(CACHE_DIR, { version: 'cache' }, '"v1"', OLD);
      server.close(() => {
        new Cache(CACHE_DIR, { seedPath: SEED_DIR }).get(endpoint, (err, json) => {
          if (err) return done(err);
          assert.deepEqual(json, { version: 'seed' });
          done();
        });
      });
    });

    it('a cachePath under a regular file is an error and the seed is unchanged', (done) => {
      const seedFile = write(SEED_DIR, { version: 'seed' }, '"v0"', NEW);
      const before = fs.readFileSync(seedFile, 'utf8');
      const blocker = path.join(TMP_DIR, 'blocker');
      fs.writeFileSync(blocker, 'x', 'utf8');
      new Cache(path.join(blocker, 'cache'), { seedPath: SEED_DIR }).get(endpoint, (err) => {
        assert.ok(err);
        assert.equal(fs.readFileSync(seedFile, 'utf8'), before);
        done();
      });
    });
  });
});
