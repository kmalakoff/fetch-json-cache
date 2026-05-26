declare module 'mkdirp-classic' {
  function mkdirp(p: string, cb: (err: Error | null) => void): void;
  namespace mkdirp {
    function sync(p: string): void;
  }
  export = mkdirp;
}
