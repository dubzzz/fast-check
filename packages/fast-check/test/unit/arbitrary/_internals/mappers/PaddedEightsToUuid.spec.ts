import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  paddedEightsToUuidMapper,
  paddedEightsToUuidUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/PaddedEightsToUuid';

const items = '0123456789abcdef';
function hexa(): fc.Arbitrary<string> {
  return fc.integer({ min: 0, max: 15 }).map((n) => items[n]);
}

describe('paddedEightsToUuidUnmapper', () => {
  it('should be able to unmap any mapped value', () =>
    fc.assert(
      fc.property(
        fc.string({ unit: hexa(), minLength: 8, maxLength: 8 }),
        fc.string({ unit: hexa(), minLength: 8, maxLength: 8 }),
        fc.string({ unit: hexa(), minLength: 8, maxLength: 8 }),
        fc.string({ unit: hexa(), minLength: 8, maxLength: 8 }),
        (a, b, c, d) => {
          // Arrange
          const ins: [string, string, string, string] = [a, b, c, d];
          const mapped = paddedEightsToUuidMapper(ins);

          // Act
          const out = paddedEightsToUuidUnmapper(mapped);

          // Assert
          expect(out).toEqual(ins);
        },
      ),
    ));
});
