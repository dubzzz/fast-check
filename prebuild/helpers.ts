const iota = (num: number) => [...Array(num)].map((v, idx) => idx);
const joiner = (num: number, fn: (v: number) => string, ch: string) =>
  iota(num)
    .map(fn)
    .join(ch);
const commas = (num: number, fn: (v: number) => string) => joiner(num, fn, ',');

const arbCommas = (num: number) => commas(num, v => `arb${v}`); // arb0,arb1,...
const txCommas = (num: number) => commas(num, v => `T${v}`); // T0,T1,...
const txXor = (num: number) => joiner(num, v => `T${v}`, '|'); // T0|T1|...

export { iota, joiner, commas, arbCommas, txCommas, txXor };
