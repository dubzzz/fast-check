import fc from 'fast-check';
import {
  timeToDateMapper,
  timeToDateMapperWithNaN,
  timeToDateUnmapper,
  timeToDateUnmapperWithNaN,
} from '../../../../../src/arbitrary/_internals/mappers/TimeToDate';

describe('timeToDateUnmapper', () => {
  it('should be able to revert any mapped date correctly', () => {
    fc.assert(
      fc.property(fc.date({ noInvalidDate: true }), (d) => {
        // Arrange / Act
        const rev = timeToDateUnmapper(d);
        const revRev = timeToDateMapper(rev);

        // Assert
        expect(revRev).toEqual(d);
      }),
    );
  });
});

describe('timeToDateUnmapperWithNane', () => {
  it('should be able to revert any mapped date correctly', () => {
    fc.assert(
      fc.property(
        fc.date({ noInvalidDate: false }),
        fc.integer({ min: -8640000000000000, max: 8640000000000000 }),
        (d, nanValue) => {
          // Arrange / Act
          const rev = timeToDateUnmapperWithNaN(nanValue)(d);
          const revRev = timeToDateMapperWithNaN(nanValue)(rev);

          // Assert
          if (d.getTime() === nanValue) {
            expect(rev).toBe(nanValue);
            expect(revRev).toEqual(new Date(Number.NaN));
          } else {
            expect(revRev.getTime()).toEqual(d.getTime());
          }
        },
      ),
    );
  });
});
