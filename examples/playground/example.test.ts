import { expect, test } from 'vitest';
import fc from 'fast-check';

test('reversing an array twice restores it', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (values) => {
      const result = [...values].reverse().reverse();
      expect(result).toEqual(values);
    }),
  );
});
