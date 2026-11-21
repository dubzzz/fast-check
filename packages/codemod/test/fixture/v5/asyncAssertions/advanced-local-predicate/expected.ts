import * as fc from 'fast-check';

function positive(n: number) {
  return n >= 0;
}
const prop = fc.property(fc.nat(), positive);
await fc.assert(prop);
