import * as fc from 'fast-check';

function run() {
  return fc.assert(fc.asyncProperty(fc.nat(), async () => true));
}
