import * as fc from 'fast-check';

test('numbers', () => {
  return fc.assert(fc.property(fc.integer(), Number.isInteger));
});
