import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import _ from 'lodash';
import { sort } from './src/sort';

describe('sort', () => {
  it('should have the same length as source', async () => {
    await fc.assert(
      fc.property(fc.array(fc.integer()), (data) => {
        expect(sort(data)).toHaveLength(data.length);
      }),
    );
  });

  it('should have exactly the same number of occurences as source for each item', async () => {
    await fc.assert(
      fc.property(fc.array(fc.integer()), (data) => {
        const sorted = sort(data);
        expect(_.groupBy(sorted)).toEqual(_.groupBy(data));
      }),
    );
  });

  it('should produce an ordered array', async () => {
    await fc.assert(
      fc.property(fc.array(fc.integer()), (data) => {
        const sorted = sort(data);
        for (let idx = 1; idx < sorted.length; ++idx) {
          expect(sorted[idx - 1]).toBeLessThanOrEqual(sorted[idx]);
        }
      }),
    );
  });

  it('should produce an ordered array with respect to a custom compare function', async () => {
    await fc.assert(
      fc.property(fc.array(fc.integer()), fc.compareBooleanFunc(), (data, compare) => {
        const sorted = sort(data, compare);
        for (let idx = 1; idx < sorted.length; ++idx) {
          // compare(sorted[idx], sorted[idx - 1]):
          // = true : sorted[idx - 1]  > sorted[idx]
          // = false: sorted[idx - 1] <= sorted[idx]
          expect(compare(sorted[idx], sorted[idx - 1])).toBe(false);
          // Meaning of compare:
          // a = b means in terms of ordering a and b are equivalent
          // a < b means in terms of ordering a comes before b
          // One important property is: a < b and b < c implies a < c
        }
      }),
    );
  });
});
