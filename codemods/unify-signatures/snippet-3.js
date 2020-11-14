import fc from 'fast-check';
import * as fcStar from 'fast-check';
import { assert, property, array, nat } from 'fast-check';
import { array as fcArray } from 'fast-check';
import fcLocal from './path';
import { array as localArray } from './path';

test('test default import', () => {
  fc.assert(fc.property(fc.array(fc.nat(), 7, 42), () => true));
});
test('test star import', () => {
  fcStar.assert(fcStar.property(fcStar.array(fcStar.nat(), 7, 42), () => true));
});
test('test specific', () => {
  assert(property(array(nat(), 7, 42), () => true));
});
test('test specific named', () => {
  assert(property(fcArray(nat(), 7, 42), () => true));
});
test('test default import (local)', () => {
  fcLocal.assert(fcLocal.property(fcLocal.array(fcLocal.nat(), 7, 42), () => true));
});
test('test specific named (local)', () => {
  assert(property(localArray(nat(), 7, 42), () => true));
});
test('test simplify unneeded min', () => {
  fc.assert(fc.property(fc.array(fc.nat(), 0, 42), () => true));
});
test('test simplify unneeded max', () => {
  fc.assert(fc.property(fc.array(fc.nat(), 10), () => true));
  fc.assert(fc.property(fc.array(fc.nat(), 1, 10), () => true));
});
test('test simplify unneeded min and max', () => {
  fc.assert(fc.property(fc.array(fc.nat(), 0, 10), () => true));
});
