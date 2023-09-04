import fc from 'fast-check';
import {
  timeToDateMapper,
  timeToDateMapperWithNaN,
  timeToDateUnmapper,
  timeToDateUnmapperWithNaN,
} from '../../../../../src/arbitrary/_internals/mappers/TimeToDate';

describe('timeToDateUnmapper', () => {
  it('should be able to revert any mapped date correctly', () =>
    fc.assert(
      fc.property(fc.date({ noInvalidDate: true }), (d) => {
        // Act
        const rev = timeToDateUnmapper(d);
        const revRev = timeToDateMapper(rev);

        // Assert
        expect(revRev).toEqual(d);
      }),
    ));
});

describe('timeToDateUnmapperWithNane', () => {
  it('should be able to revert any mapped date correctly', () =>
    fc.assert(
      fc.property(
        fc.date({ noInvalidDate: false }),
        fc.integer({ min: -8640000000000000, max: 8640000000000000 }),
        (d, nanValue) => {
          // Act
          const rev = timeToDateUnmapperWithNaN(nanValue)(d);
          const revRev = timeToDateMapperWithNaN(nanValue)(rev);

          // Assert
          expect(revRev).toEqual(d);
        },
      ),
    ));
});
