import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  paddedUintToBase32StringMapper,
  uintToBase32StringUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/UintToBase32String.js';

describe('uintToBase32StringUnmapper', () => {
  it('should be able to unmap any mapped value', async () =>
    await fc.assert(
      fc.asyncProperty(fc.maxSafeNat(), fc.integer({ min: 6, max: 20 }), (input, length) => {
        // Arrange
        const mapped = paddedUintToBase32StringMapper(length)(input);
        // Act
        const out = uintToBase32StringUnmapper(mapped);
        // Assert
        expect(out).toEqual(input);
      }),
    ));
});
