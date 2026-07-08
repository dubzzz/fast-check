import * as fc from 'fast-check';

console.log(fc.sample(fc.nat(), { seed: 42, numRuns: 5 }));
