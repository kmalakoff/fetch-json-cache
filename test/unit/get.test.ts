import assert from 'assert';
import Cache from 'fetch-json-cache';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import http from 'http';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import url from 'url';

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
});
