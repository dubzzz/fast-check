import * as fc from 'fast-check';

async function abc() {
  fc.assert(fc.property(fc.nat(), (n) => true));
}
