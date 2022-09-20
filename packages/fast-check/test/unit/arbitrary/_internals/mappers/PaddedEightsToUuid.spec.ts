import fc from 'fast-check';
import {
  paddedEightsToUuidMapper,
  paddedEightsToUuidUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/PaddedEightsToUuid';

describe('paddedEightsToUuidUnmapper', () => {
  it('should be able to unmap any mapped value', () =>
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 8, maxLength: 8 }),
        fc.hexaString({ minLength: 8, maxLength: 8 }),
        fc.hexaString({ minLength: 8, maxLength: 8 }),
        fc.hexaString({ minLength: 8, maxLength: 8 }),
        (a, b, c, d) => {
          // Arrange
          const ins: [string, string, string, string] = [a, b, c, d];
          const mapped = paddedEightsToUuidMapper(ins);

          // Act
          const out = paddedEightsToUuidUnmapper(mapped);

          // Assert
          expect(out).toEqual(ins);
        }
      )
    ));
});
