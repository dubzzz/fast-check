import * as fc from 'fast-check';

function run() {
  // This helper has synchronous callers.
  fc.assert(property);
}
