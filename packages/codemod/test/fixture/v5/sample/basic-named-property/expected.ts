import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.nat(), async () => false);
const values = await fc.sample(property, {
  noPredicateExecution: true
});
