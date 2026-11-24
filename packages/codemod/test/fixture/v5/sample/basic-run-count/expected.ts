import * as fc from 'fast-check';

const values = await fc.sample(fc.nat(), {
  numRuns: 3
});
