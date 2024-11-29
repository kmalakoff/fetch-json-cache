"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return Cache;
    }
});
require("./polyfills.js");
var _rimraf2 = /*#__PURE__*/ _interop_require_default(require("rimraf2"));
var _get = /*#__PURE__*/ _interop_require_default(require("./get"));
var _getSync = /*#__PURE__*/ _interop_require_default(require("./getSync"));
var _hash = /*#__PURE__*/ _interop_require_default(require("./hash"));
var _update = /*#__PURE__*/ _interop_require_default(require("./update"));
function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
var Cache = /*#__PURE__*/ function() {
    "use strict";
    function Cache(cacheDirectory, options) {
        _class_call_check(this, Cache);
        if (!_instanceof(this, Cache)) throw new Error('Cache needs to be called with new');
        if (!cacheDirectory) throw new Error('Cache needs cacheDirectory');
        this.cacheDirectory = cacheDirectory;
        this.options = typeof options === 'undefined' ? {} : options;
        if (!this.options.hash) this.options.hash = _hash.default;
    }
    _create_class(Cache, [
        {
            key: "get",
            value: function get(endpoint, options, callback) {
                var _this = this;
                if (typeof options === 'function') {
                    callback = options;
                    options = null;
                }
                options = options || {};
                if (typeof callback === 'function') return options.force ? _update.default.call(this, endpoint, callback) : _get.default.call(this, endpoint, callback);
                return new Promise(function(resolve, reject) {
                    _this.get(endpoint, options, function(err, json) {
                        err ? reject(err) : resolve(json);
                    });
                });
            }
        },
        {
            key: "getSync",
            value: function getSync(endpoint, _options) {
                // TODO: add async fetching
                return _getSync.default.call(this, endpoint);
            }
        },
        {
            key: "clear",
            value: function clear(callback) {
                var _this = this;
                if (typeof callback === 'function') return (0, _rimraf2.default)(this.cacheDirectory, {
                    disableGlob: true
                }, function(_err) {
                    _err = null; // ignore errors since it is fine to delete a directory that doesn't exist from a cache standpoint
                    callback();
                });
                return new Promise(function(resolve, reject) {
                    _this.clear(function(err, json) {
                        err ? reject(err) : resolve(json);
                    });
                });
            }
        }
    ]);
    return Cache;
}();
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }