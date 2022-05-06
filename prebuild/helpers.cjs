// @ts-check

/**
 * @param num {number}
 */
const iota = (num) => [...Array(num)].map((v, idx) => idx);

/**
 * @param num {number}
 * @param fn {(v: number) => string}
 * @param ch {string}
 */
const joiner = (num, fn, ch) => iota(num).map(fn).join(ch);

/**
 * @param num {number}
 * @param fn {(v: number) => string}
 */
const commas = (num, fn) => joiner(num, fn, ',');

/**
 * arb0,arb1,...
 * @param num {number}
 */
const arbCommas = (num) => commas(num, (v) => `arb${v}`);

/**
 * T0,T1,...
 * @param num {number}
 */
const txCommas = (num) => commas(num, (v) => `T${v}`);

/**
 * T0|T1|...
 * @param num {number}
 */
const txXor = (num) => joiner(num, (v) => `T${v}`, '|');

exports.iota = iota;
exports.joiner = joiner;
exports.commas = commas;
exports.arbCommas = arbCommas;
exports.txCommas = txCommas;
exports.txXor = txXor;
