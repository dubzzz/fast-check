import * as fc from 'fast-check';

test('numbers', () => {
  fc.assert(fc.property(fc.integer(), Number.isInteger));
});
