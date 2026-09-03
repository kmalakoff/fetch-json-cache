// Reaches the network: fetches package metadata from registry.npmjs.org
import assert from 'assert';
import Cache from 'fetch-json-cache';
import { safeRm } from 'fs-remove-compat';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, '..', '..', '.tmp');
const ENDPOINT = 'https://registry.npmjs.org/-/package/npm/dist-tags';

interface DistTags {
  latest: string;
  [tag: string]: string;
}

interface LatestOnly {
  latest: string;
}

describe('transform', () => {
  beforeEach((cb) => safeRm(TMP_DIR, cb));

  it('stores the transformed body', (done) => {
    // no casts: TWire is what nodejs sends, TStored is what we keep
    const cache = new Cache<DistTags, LatestOnly>(TMP_DIR, { transform: (body) => ({ latest: body.latest }) });

    cache.get(ENDPOINT, (err, json): void => {
      if (err) return done(err);
      assert.ok(json?.latest);
      assert.deepEqual(Object.keys(json as object), ['latest']);
      done();
    });
  });

  it('getSync returns the same shape the async path stored', (done) => {
    const cache = new Cache<DistTags, LatestOnly>(TMP_DIR, { transform: (body) => ({ latest: body.latest }) });

    cache.get(ENDPOINT, (err): void => {
      if (err) return done(err);
      // getSync defaults to TStored, so this is LatestOnly without annotating it
      const synced = cache.getSync(ENDPOINT);
      assert.deepEqual(Object.keys(synced as object), ['latest']);
      done();
    });
  });

  it('receives the endpoint so one cache can treat urls differently', (done) => {
    const seen: string[] = [];
    const cache = new Cache(TMP_DIR, {
      transform: (body, endpoint) => {
        seen.push(endpoint);
        return body;
      },
    });

    cache.get<DistTags>(ENDPOINT, (err): void => {
      if (err) return done(err);
      assert.deepEqual(seen, [ENDPOINT]);
      done();
    });
  });

  it('stores the full body when no transform is given', (done) => {
    const cache = new Cache(TMP_DIR);

    cache.get<DistTags>(ENDPOINT, (err, json): void => {
      if (err) return done(err);
      assert.ok(Object.keys(json as object).length > 1);
      done();
    });
  });
});
