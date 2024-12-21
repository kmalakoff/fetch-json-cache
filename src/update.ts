import path from 'path';
import get from 'get-remote';
import mkdirp from 'mkdirp-classic';
import writeFile from 'write-file-atomic';

export default function update(endpoint, callback) {
  const fullPath = path.join(this.cacheDirectory, `${this.options.hash(endpoint)}.json`);

  mkdirp(this.cacheDirectory, (err) => {
    if (err && err.code !== 'EEXIST') return callback(err);

    get(endpoint).json((err, res) => {
      if (err) return callback(err);

      const record = { headers: res.headers, body: res.body };
      writeFile(fullPath, JSON.stringify(record), 'utf8', (err) => {
        err ? callback(err) : callback(null, record.body);
      });
    });
  });
}
