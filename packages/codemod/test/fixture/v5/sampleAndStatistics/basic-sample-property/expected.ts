import * as fc from 'fast-check';

const values = await fc.sample(fc.property(fc.nat(), () => false), {
  noPredicateExecution: true
});
