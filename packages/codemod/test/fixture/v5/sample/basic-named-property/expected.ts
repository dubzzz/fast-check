import * as fc from 'fast-check';

const property = fc.property(fc.nat(), () => false);
const values = await fc.sample(property, {
  noPredicateExecution: true
});
