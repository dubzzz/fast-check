export const iota = (num: number) => [...Array(num)].map((v, idx) => idx);
export const joiner = (num: number, fn: (v: number) => string, ch: string) =>
  iota(num)
    .map(fn)
    .join(ch);
export const commas = (num: number, fn: (v: number) => string) => joiner(num, fn, ',');

export const arbCommas = (num: number) => commas(num, v => `arb${v}`); // arb0,arb1,...
export const txCommas = (num: number) => commas(num, v => `T${v}`); // T0,T1,...
export const txXor = (num: number) => joiner(num, v => `T${v}`, '|'); // T0|T1|...
