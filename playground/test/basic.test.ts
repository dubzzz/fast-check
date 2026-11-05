import { expect, test } from 'vitest';
import * as fc from 'fast-check';
import { reverse } from '../src/basic.js';

test('reversing an array twice restores it', async () => {
  await fc.assert(
    fc.property(fc.array(fc.integer()), (values) => {
      expect(reverse(reverse(values))).toEqual(values);
    }),
  );
});
