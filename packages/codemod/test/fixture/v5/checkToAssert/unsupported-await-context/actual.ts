import * as fc from 'fast-check';

function checkNow() {
  const details = fc.check(fc.property(fc.nat(), Number.isInteger));
  return details.seed;
}
