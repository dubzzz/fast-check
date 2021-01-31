// See https://github.com/paulmillr/es6-shim/commit/2367e0953edd01ae9a5628e1f47cf14b0377a7d6
// and https://github.com/tc39/proposal-global/blob/269dd7c646451e72e3e3edc573b57ce766aac86a/README.md#rationale

/**
 * Internal polyfill for `globalThis`
 * @internal
 */
export let getGlobal = () => {
  const globalThis = (function () {
    // the only reliable means to get the global object is
    // `Function('return this')()`
    // However, this causes CSP violations in Chrome apps.
    if (typeof self !== 'undefined') { return self; }
    if (typeof window !== 'undefined') { return window; }
    if (typeof global !== 'undefined') { return global; }
    throw new Error('unable to locate global object');
  })();
  
  getGlobal = () => globalThis
  return globalThis;
};
