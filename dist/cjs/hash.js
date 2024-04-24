"use strict";
var crypto = require("crypto");
module.exports = function hash(data) {
    return crypto.createHash("md5").update(data).digest("hex");
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }