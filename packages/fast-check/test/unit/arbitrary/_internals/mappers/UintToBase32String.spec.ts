import fc from 'fast-check';
import {
  paddedUintToBase32StringMapper,
  uintToBase32StringUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/UintToBase32String';

describe('uintToBase32StringUnmapper', () => {
  it('should be able to unmap any mapped value', () =>
    fc.assert(
      fc.property(fc.maxSafeNat(), (input) => {
        // Arrange
        const mapped = paddedUintToBase32StringMapper(12)(input);
        // Act
        const out = uintToBase32StringUnmapper(mapped);
        // Assert
        expect(out).toEqual(input);
      })
    ));
});
