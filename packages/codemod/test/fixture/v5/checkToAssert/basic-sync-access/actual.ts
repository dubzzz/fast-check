import * as fc from 'fast-check';

const property = fc.property(fc.nat(), (n) => n < 100);
const failed = fc.check(property).failed;
const { seed, counterexample: value } = fc.check(property, { seed: 42 });
console.log(failed, seed, value);
