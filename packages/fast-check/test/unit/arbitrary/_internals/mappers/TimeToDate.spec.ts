import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  timeToDateMapper,
  timeToDateMapperWithNaN,
  timeToDateUnmapper,
  timeToDateUnmapperWithNaN,
} from '../../../../../src/arbitrary/_internals/mappers/TimeToDate';

describe('timeToDateUnmapper', () => {
  it('should be able to revert any mapped date correctly even invalid ones', () => {
    fc.assert(
      fc.property(fc.date(), (d) => {
        // Arrange / Act
        const rev = timeToDateUnmapper(d);
        const revRev = timeToDateMapper(rev);

        // Assert
        expect(revRev.getTime()).toEqual(d.getTime());
      }),
    );
  });
});

describe('timeToDateUnmapperWithNaN', () => {
  it('should be able to revert any mapped date correctly even invalid once', () => {
    fc.assert(
      fc.property(fc.date(), fc.integer({ min: -8640000000000000, max: 8640000000000001 }), (d, nanValue) => {
        // Arrange / Act
        const rev = timeToDateUnmapperWithNaN(nanValue)(d);
        const revRev = timeToDateMapperWithNaN(nanValue)(rev);

        // Assert
        if (d.getTime() === nanValue) {
          expect(rev).toBe(nanValue);
          expect(revRev.getTime()).toEqual(Number.NaN);
        } else {
          expect(revRev.getTime()).toEqual(d.getTime());
        }
      }),
    );
  });
});
