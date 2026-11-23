import * as fc from 'fast-check';
import * as other from 'another-lib';

fc.assert(fc.property(fc.nat(), () => true));
test('uses a shadowed namespace', () => {
  const fc = other;
  fc.assert(fc.property(fc.nat(), () => true));
});
