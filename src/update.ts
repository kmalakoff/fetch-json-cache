import fs from 'fs';
import get from 'get-remote';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Queue from 'queue-cb';
import rimraf2 from 'rimraf2';
import tempSuffix from 'temp-suffix';

export default function update(endpoint, callback) {
  const fullPath = path.join(this.cachePath, `${this.options.hash(endpoint)}.json`);

  mkdirp(this.cachePath, (err) => {
    if (err && err.code !== 'EEXIST') return callback(err);

    get(endpoint).json((err, res) => {
      if (err) return callback(err);
      const record = { headers: res.headers, body: res.body };
      const tempFile = `${fullPath}-${tempSuffix()}`;

      const queue = new Queue(1);
      queue.defer(fs.writeFile.bind(null, tempFile, JSON.stringify(record), 'utf8'));
      queue.defer((cb) => rimraf2(fullPath, { disableGlob: true }, cb.bind(null, null)));
      queue.defer(fs.rename.bind(null, tempFile, fullPath));
      queue.await((err) => {
        if (!err) return callback(null, record.body);
        // cleanup the temp file if the operation failed
        rimraf2(tempFile, { disableGlob: true }, callback.bind(err));
      });
    });
  });
}
