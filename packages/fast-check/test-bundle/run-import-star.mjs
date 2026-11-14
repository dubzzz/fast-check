import * as fc from 'fast-check';

console.log(await fc.sample(fc.nat(), { seed: 42, numRuns: 5 }));
