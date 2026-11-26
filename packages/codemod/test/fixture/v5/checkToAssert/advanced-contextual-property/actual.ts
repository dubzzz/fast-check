import * as fc from 'fast-check';

const property = fc.property(fc.nat(), (n) => n < 100);
const out = fc.check({
  ...property,
  generate(random, runId) {
    return property.generate(random, runId);
  },
});
console.log(out.failed);
