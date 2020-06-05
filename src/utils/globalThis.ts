// Implementation of globalThis derived from https://github.com/tc39/proposal-global/blob/master/polyfill.js

/** @hidden */
// tslint:disable
const internalGlobalThis: any = (function (global) {
  return global.globalThis ? global.globalThis : global;
})(typeof this === 'object' ? this : Function('return this')());

/**
 * @hidden
 * Internal polyfill for `globalThis`
 */
export const getGlobal = () => internalGlobalThis;
