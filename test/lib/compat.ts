/**
 * Compatibility Layer for Node.js 0.8+
 * Local to this package - contains only needed functions.
 */

import fs from 'fs';
import Module from 'module';

// Use existing require in CJS, or createRequire in ESM (Node 12.2+)
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

export function existsSync(test: string): boolean {
  try {
    (fs.accessSync || fs.statSync)(test);
    return true;
  } catch (_) {
    return false;
  }
}

// Native fs.mkdirSync({ recursive }) from Node 10.12, mkdirp-classic below
const nodeVersion = process.versions.node.split('.');
const hasRecursiveMkdir = +nodeVersion[0] > 10 || (+nodeVersion[0] === 10 && +nodeVersion[1] >= 12);
export function mkdirRecursive(dir: string): void {
  if (hasRecursiveMkdir) return fs.mkdirSync(dir, { recursive: true }) as void;
  _require('mkdirp-classic').sync(dir);
}
