import assert from 'assert';
import { spawn } from 'child_process';
import Cache from 'fetch-json-cache';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import http from 'http';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, '..', '..', '.tmp');
const CHILD = path.join(__dirname, '..', 'lib', 'updateChild.cjs');
const ROOT = path.join(__dirname, '..', '..');

const PAYLOAD = JSON.stringify({ list: new Array(2000).join('x').split('') });

// node 0.x fetches through a blocking child process, so it cannot answer a server hosted in its own process
const major = +process.versions.node.split('.')[0];
(major === 0 ? describe.skip : describe)('update', () => {
  let server: http.Server;
  let endpoint: string;

  beforeEach((cb) => {
    safeRm(TMP_DIR, () => {
      server = http.createServer((_req, res) => {
        res.writeHead(200, { 'content-type': 'application/json', etag: `"${Date.now()}"` });
        res.end(PAYLOAD);
      });
      server.listen(0, '127.0.0.1', () => {
        endpoint = `http://127.0.0.1:${(server.address() as { port: number }).port}/data`;
        cb();
      });
    });
  });
  afterEach((cb) => server.close(() => cb()));

  it('two processes updating the same endpoint never leave the file missing or partial for a reader', (done) => {
    const cache = new Cache(TMP_DIR);
    const file = path.join(TMP_DIR, `${cache.options.hash?.(endpoint)}.json`);
    let running = 2;
    let seen = false;
    let reads = 0;
    let failure: Error | null = null;
    let stopped = false;

    function read() {
      if (stopped) return;
      try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
        assert.equal(parsed.body.list.length, 1999);
        seen = true;
        reads++;
      } catch (err) {
        // before the first write there is no file yet; after it, a missing or partial file is the failure
        if (seen) {
          failure = err as Error;
          stopped = true;
          return;
        }
      }
      setImmediate(read);
    }
    read();

    function onExit(code: number | null) {
      assert.equal(code, 0);
      if (--running) return;
      stopped = true;
      if (failure) return done(failure);
      assert.ok(reads > 0);
      done();
    }
    for (let i = 0; i < 2; i++) {
      const child = spawn(process.execPath, [CHILD, TMP_DIR, endpoint, '40'], { cwd: ROOT, stdio: 'inherit' });
      child.on('close', onExit);
    }
  });
});
