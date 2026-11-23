import * as fc from 'fast-check';

function abc() {
  fc.assert(fc.property(fc.nat(), (n) => true));
}
