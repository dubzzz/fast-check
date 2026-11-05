import { expect, test } from 'vitest';
import * as fc from 'fast-check';
import { insertionSort } from '../src/basic.js';

test('sorts numbers in ascending order', async () => {
  await fc.assert(
    fc.property(fc.array(fc.integer()), (values) => {
      const sorted = insertionSort(values);
      for (let index = 1; index < sorted.length; ++index) {
        expect(sorted[index - 1]).toBeLessThanOrEqual(sorted[index]);
      }
    }),
  );
});

test('preserves the length and distinct values', async () => {
  await fc.assert(
    fc.property(fc.array(fc.integer()), (values) => {
      const sorted = insertionSort(values);
      expect(sorted).toHaveLength(values.length);
      expect(new Set(sorted)).toEqual(new Set(values));
    }),
  );
});

test('sorting twice gives the same result', async () => {
  await fc.assert(
    fc.property(fc.array(fc.integer()), (values) => {
      const sorted = insertionSort(values);
      expect(insertionSort(sorted)).toEqual(sorted);
    }),
  );
});

test('does not change the input', async () => {
  await fc.assert(
    fc.property(fc.array(fc.integer()), (values) => {
      const original = [...values];
      insertionSort(values);
      expect(values).toEqual(original);
    }),
  );
});
