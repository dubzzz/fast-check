import fc from 'fast-check';
import {
  paddedUintToBase32StringMapper,
  uintToBase32StringUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/UintToBase32String';

describe('uintToBase32StringUnmapper', () => {
  it('should be able to unmap any mapped value', () =>
    fc.assert(
      fc.property(fc.integer({ min: 0 }), (input) => {
        // Arrange
        const mapped = paddedUintToBase32StringMapper(10)(input);
        // Act
        const out = uintToBase32StringUnmapper(mapped);
        // Assert
        expect(out).toEqual(input);
      })
    ));
});
