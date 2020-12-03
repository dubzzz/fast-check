// Implementation of globalThis derived from https://github.com/tc39/proposal-global/blob/master/polyfill.js

/** @internal */
// tslint:disable
const internalGlobalThis: any = (function (global) {
  return global.globalThis ? global.globalThis : global;
})(typeof this === 'object' ? this : Function('return this')());

/**
 * Internal polyfill for `globalThis`
 * @internal
 */
export const getGlobal: any = () => internalGlobalThis;
