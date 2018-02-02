const iota = (num: number) => [...Array(num)].map((v, idx) => idx);
const commas = (num: number, fn: (v :number) => string) => iota(num).map(fn).join(',')

const arbCommas = (num: number) => commas(num, v => `arb${v}`); // arb0,arb1,...
const txCommas = (num: number) => commas(num, v => `T${v}`); // T0,T1,...

export { iota, commas, arbCommas, txCommas };
