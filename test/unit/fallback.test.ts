import assert from 'assert';
import Cache from 'fetch-json-cache';
import { safeRm } from 'fs-remove-compat';
import http from 'http';
import type { Socket } from 'net';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, '..', '..', '.tmp');

// node 0.x fetches through a blocking child process, so it cannot answer a server hosted in its own process
const major = +process.versions.node.split('.')[0];
(major === 0 ? describe.skip : describe)('fallback to the cached copy', () => {
  let server: http.Server;
  let sockets: Socket[];
  let port: number;
  let endpoint: string;
  let hang: boolean;

  function listen(listenPort: number, cb: () => void) {
    server = http.createServer((req, res) => {
      if (hang && req.method === 'HEAD') return; // never answer the freshness check
      res.writeHead(200, { 'content-type': 'application/json', etag: '"v1"' });
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ value: 'cached' }));
    });
    server.on('connection', (socket) => sockets.push(socket));
    server.listen(listenPort, '127.0.0.1', () => {
      port = (server.address() as { port: number }).port;
      endpoint = `http://127.0.0.1:${port}/data`;
      cb();
    });
  }
  function close(cb: () => void) {
    for (let i = 0; i < sockets.length; i++) sockets[i].destroy();
    sockets = [];
    server.close(() => cb());
  }

  beforeEach((cb) => {
    hang = false;
    sockets = [];
    safeRm(TMP_DIR, () => listen(0, cb));
  });
  afterEach((cb) => close(cb));

  it('server down (ECONNREFUSED) returns the cached body', (done) => {
    const cache = new Cache(TMP_DIR);
    cache.get<{ value: string }>(endpoint, (err, json) => {
      if (err) return done(err);
      assert.equal(json?.value, 'cached');
      close(() => {
        cache.get<{ value: string }>(endpoint, (err, json) => {
          if (err) return done(err);
          assert.equal(json?.value, 'cached');
          listen(0, done); // afterEach closes a live server
        });
      });
    });
  });

  it('server hanging past the timeout returns the cached body', function (done) {
    this.timeout(30000);
    const cache = new Cache(TMP_DIR);
    cache.get<{ value: string }>(endpoint, (err, json) => {
      if (err) return done(err);
      assert.equal(json?.value, 'cached');
      hang = true;
      cache.get<{ value: string }>(endpoint, (err, json) => {
        if (err) return done(err);
        assert.equal(json?.value, 'cached');
        done();
      });
    });
  });

  it('no cache and server down fails', (done) => {
    const cache = new Cache(TMP_DIR);
    close(() => {
      cache.get(endpoint, (err, json) => {
        assert.ok(err);
        assert.ok(!json);
        listen(0, done);
      });
    });
  });
});
