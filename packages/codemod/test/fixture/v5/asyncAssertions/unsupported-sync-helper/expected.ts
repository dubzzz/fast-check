import * as fc from 'fast-check';

function run() {
  // Adding await here would change the synchronous helper's contract.
  fc.assert(fc.property(fc.integer(), Number.isInteger));
}
