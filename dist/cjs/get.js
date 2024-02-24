"use strict";
var fs = require("fs");
var path = require("path");
var get = require("get-remote");
var update = require("./update");
module.exports = function getCache(endpoint, callback) {
    var _this = this;
    var fullPath = path.join(this.cacheDirectory, "".concat(this.options.hash(endpoint), ".json"));
    fs.readFile(fullPath, function(err, contents) {
        // doesn't exist so create
        if (err) {
            update.call(_this, endpoint, function(err, json) {
                err ? callback(err) : callback(null, json);
            });
        } else {
            var record = JSON.parse(contents.toString());
            get(endpoint).head(function(err, res) {
                // not accessible
                if (err) {
                    if (err.code === "ENOTFOUND" || err.message.indexOf("routines:SSL23_GET_SERVER_HELLO") >= 0) return callback(null, record.body);
                    return callback(err);
                }
                if (res.headers.etag === record.headers.etag) return callback(null, record.body);
                update.call(_this, endpoint, function(err, json) {
                    err ? callback(err) : callback(null, json);
                });
            });
        }
    });
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }