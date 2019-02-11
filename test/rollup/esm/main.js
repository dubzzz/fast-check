import * as fc from '../../../lib/esm/fast-check';
console.log(fc.sample(fc.lorem(), { seed: 42, numRuns: 5 }));
