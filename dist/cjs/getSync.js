"use strict";
var fs = require('fs');
var path = require('path');
module.exports = function getCacheAsync(endpoint) {
    var fullPath = path.join(this.cacheDirectory, "".concat(this.options.hash(endpoint), ".json"));
    try {
        var contents = fs.readFileSync(fullPath, 'utf8');
        var record = JSON.parse(contents.toString());
        return record.body;
    } catch (_err) {
        return null;
    }
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }