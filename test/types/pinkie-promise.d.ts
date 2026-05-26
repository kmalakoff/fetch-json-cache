declare module 'pinkie-promise' {
  // biome-ignore lint/suspicious/noShadowRestrictedNames: intentional — this module polyfills Promise
  const Promise: PromiseConstructor;
  export = Promise;
}
