import fc from '../../../../../lib/fast-check';
import {
  numberToPaddedEightMapper,
  numberToPaddedEightUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/NumberToPaddedEight';

describe('numberToPaddedEightUnmapper', () => {
  it('should be able to unmap any mapped value', () =>
    fc.assert(
      fc.property(fc.nat({ max: 0xffffffff }), (n) => {
        // Arrange
        const mapped = numberToPaddedEightMapper(n);

        // Act
        const out = numberToPaddedEightUnmapper(mapped);

        // Assert
        expect(out).toBe(n);
      })
    ));
});
