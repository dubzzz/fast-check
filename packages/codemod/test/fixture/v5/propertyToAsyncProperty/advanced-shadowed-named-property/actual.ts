import { assert, nat, property } from 'fast-check';
import * as other from 'another-lib';

assert(property(nat(), () => true));
test('uses a shadowed property', () => {
  const property = other.property;
  other.assert(property(other.nat(), () => true));
});
