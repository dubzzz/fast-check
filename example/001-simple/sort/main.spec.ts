import fc from 'fast-check';
import * as _ from 'lodash';
import { sort } from './src/sort';

describe('sort', () => {
  it('should have the same length as source', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), data => {
        expect(sort(data)).toHaveLength(data.length);
      })
    );
  });

  it('should have exactly the same number of occurences as source for each item', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), data => {
        const sorted = sort(data);
        expect(_.groupBy(sorted)).toEqual(_.groupBy(data));
      })
    );
  });

  it('should produce an ordered array', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), data => {
        const sorted = sort(data);
        for (let idx = 1; idx < sorted.length; ++idx) {
          expect(sorted[idx - 1]).toBeLessThanOrEqual(sorted[idx]);
        }
      })
    );
  });
});
