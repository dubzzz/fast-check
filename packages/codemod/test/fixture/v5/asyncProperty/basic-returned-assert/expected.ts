import * as fc from 'fast-check';

function run() {
  return fc.assert(fc.property(fc.nat(), async () => true));
}
