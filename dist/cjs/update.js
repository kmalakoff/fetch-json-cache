"use strict";
var path = require('path');
var get = require('get-remote');
var mkpath = require('mkpath');
var writeFile = require('write-file-atomic');
module.exports = function update(endpoint, callback) {
    var fullPath = path.join(this.cacheDirectory, "".concat(this.options.hash(endpoint), ".json"));
    mkpath(this.cacheDirectory, function(err) {
        if (err && err.code !== 'EEXIST') return callback(err);
        get(endpoint).json(function(err, res) {
            if (err) return callback(err);
            var record = {
                headers: res.headers,
                body: res.body
            };
            writeFile(fullPath, JSON.stringify(record), 'utf8', function(err) {
                err ? callback(err) : callback(null, record.body);
            });
        });
    });
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }