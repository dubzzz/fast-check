const fc = require('fast-check');
const { assert, property, array, nat } = require('fast-check');
const { array: fcArray } = require('fast-check');
const fcLocal = require('./path');
const { array: localArray } = require('./path');

test('test default import', () => {
  fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
});
test('test specific', () => {
  assert(property(array(nat(), 7, 10), () => true));
});
test('test specific named', () => {
  assert(property(fcArray(nat(), 7, 10), () => true));
});
test('test default import (local)', () => {
  fcLocal.assert(fcLocal.property(fcLocal.array(fcLocal.nat(), 7, 10), () => true));
});
test('test specific named (local)', () => {
  assert(property(localArray(nat(), 7, 10), () => true));
});
