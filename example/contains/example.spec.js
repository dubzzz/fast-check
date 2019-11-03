const assert = require('assert');
const fc = require('fast-check');
const { unit_tests } = require('./units');
const { contains } = require('./contains');

describe('contains', () => {
  unit_tests(contains);
  it('should always contain b in a+b+c', () =>
    fc.assert(fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => contains(b, a + b + c))));
});
