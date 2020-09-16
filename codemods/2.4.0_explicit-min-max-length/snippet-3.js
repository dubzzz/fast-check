import fc from 'fast-check';
import * as fcStar from 'fast-check';
import { assert, property, array, nat } from 'fast-check';
import { array as fcArray } from 'fast-check';

test('test default import', () => {
  fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
});
test('test star import', () => {
  fcStar.assert(fcStar.property(fcStar.array(fcStar.nat(), 7, 10), () => true));
});
test('test specific', () => {
  assert(property(array(nat(), 7, 10), () => true));
});
test('test specific named', () => {
  assert(property(fcArray(nat(), 7, 10), () => true));
});
