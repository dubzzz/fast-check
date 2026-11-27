import * as fc from 'fast-check';

const property = fc.property(fc.nat(), (n) => n < 100);
const failed = fc.check(property).failed;
const computed = fc.check(property)['failed'];
const { seed, counterexample: value } = fc.check(property, { seed: 42 });
let counterexample;
({ counterexample } = fc.check(property));
const out = fc.check(property);
const { numRuns } = out;
await out.failed;
console.log(failed, computed, seed, value, counterexample, numRuns);
