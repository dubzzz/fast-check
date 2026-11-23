import { assert, nat, asyncProperty } from 'fast-check';
import * as other from 'another-lib';

await assert(asyncProperty(nat(), () => true));
test('uses a shadowed property', () => {
  const property = other.property;
  other.assert(property(other.nat(), () => true));
});
