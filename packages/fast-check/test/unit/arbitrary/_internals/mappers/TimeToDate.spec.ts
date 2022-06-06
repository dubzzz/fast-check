import fc from 'fast-check';
import { timeToDateMapper, timeToDateUnmapper } from '../../../../../src/arbitrary/_internals/mappers/TimeToDate';

describe('timeToDateUnmapper', () => {
  it('should be able to revert any mapped date correctly', () =>
    fc.assert(
      fc.property(fc.date(), (d) => {
        // Act
        const rev = timeToDateUnmapper(d);
        const revRev = timeToDateMapper(rev);

        // Assert
        expect(revRev).toEqual(d);
      })
    ));
});
