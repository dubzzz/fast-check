import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  applyFlagsOnChars,
  computeFlagsFromChars,
  computeNextFlags,
  computeTogglePositions,
  countToggledBits,
} from '../../../../../src/arbitrary/_internals/helpers/ToggleFlags.js';

describe('countToggledBits', () => {
  it('should properly count when zero bits are toggled', () => {
    expect(countToggledBits(0n)).toBe(0);
  });

  it('should properly count when all bits are toggled', () => {
    expect(countToggledBits(BigInt(0xffffffff))).toBe(32);
  });

  it('should properly count when part of the bits are toggled', () => {
    expect(countToggledBits(7456n)).toBe(5);
  });
});

describe('computeNextFlags', () => {
  it('should keep the same flags if size has not changed', () => {
    const flags = 243n; // 11110011 -> 11110011
    expect(computeNextFlags(flags, 8)).toBe(flags);
  });

  it('should keep the same flags if number of starting zeros is enough', () => {
    const flags = 121n; // 01111001 -> 1111001
    expect(computeNextFlags(flags, 7)).toBe(flags);
  });

  it('should keep the same flags if size is longer', () => {
    const flags = 242n; // 11110010 -> 011110010
    expect(computeNextFlags(flags, 9)).toBe(flags);
  });

  it('should keep the same number of toggled flags for flags not existing anymore', () => {
    const flags = 147n; // 10010011
    const expectedFlags = 23n; // 0010111 - start by filling by the right
    expect(computeNextFlags(flags, 7)).toBe(expectedFlags);
  });

  it('should properly deal with cases where flags have to be removed', () => {
    const flags = 243n; // 11110011
    const expectedFlags = 3n; // 11
    expect(computeNextFlags(flags, 2)).toBe(expectedFlags);
  });

  it('should preserve the same number of flags', async () => {
    await fc.assert(
      fc.asyncProperty(fc.bigInt({ min: 0n }), fc.nat(100), (flags, offset) => {
        const sourceToggled = countToggledBits(flags);
        const nextSize = sourceToggled + offset; // anything >= sourceToggled
        const nextFlags = computeNextFlags(flags, nextSize);
        expect(countToggledBits(nextFlags)).toBe(sourceToggled);
      }),
    );
  });

  it('should preserve the position of existing flags', async () => {
    await fc.assert(
      fc.asyncProperty(fc.bigInt({ min: 0n }), fc.integer({ min: 1, max: 100 }), (flags, nextSize) => {
        const nextFlags = computeNextFlags(flags, nextSize);
        for (let idx = 0, mask = 1n; idx !== nextSize; ++idx, mask <<= 1n) {
          if (flags & mask) expect(!!(nextFlags & mask)).toBe(true);
        }
      }),
    );
  });

  it('should not return flags larger than the asked size', async () => {
    await fc.assert(
      fc.asyncProperty(fc.bigInt({ min: 0n }), fc.nat(100), (flags, nextSize) => {
        const nextFlags = computeNextFlags(flags, nextSize);
        expect(nextFlags < 1n << BigInt(nextSize)).toBe(true);
      }),
    );
  });
});

describe('computeTogglePositions', () => {
  it('should properly tag toggleable positions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 1 })),
        fc.func(fc.string({ minLength: 1, maxLength: 1 })),
        (chars, toggleCase) => {
          // Arrange / Act
          const positions = computeTogglePositions(chars, toggleCase);

          // Assert
          for (const p of positions) {
            expect(toggleCase(chars[p])).not.toBe(chars[p]);
          }
        },
      ),
    );
  });

  it('should not tag untoggleable positions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 1 })),
        fc.func(fc.string({ minLength: 1, maxLength: 1 })),
        (chars, toggleCase) => {
          // Arrange / Act
          const positions = computeTogglePositions(chars, toggleCase);

          // Assert
          for (let index = 0; index !== chars.length; ++index) {
            if (!positions.includes(index)) {
              expect(toggleCase(chars[index])).toBe(chars[index]);
            }
          }
        },
      ),
    );
  });
});

describe('computeFlagsFromChars', () => {
  it('should be able to find back flags out of source and final chars', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 1 })),
        fc.func(fc.string({ minLength: 1, maxLength: 1 })),
        fc.bigInt({ min: 0n }),
        (chars, toggleCase, flagsUnmasked) => {
          // Arrange
          const positions = computeTogglePositions(chars, toggleCase);
          const mask = (1n << BigInt(positions.length)) - 1n;
          const flags = flagsUnmasked & mask;
          const finalChars = [...chars];
          applyFlagsOnChars(finalChars, flags, positions, toggleCase);

          // Act
          const out = computeFlagsFromChars(chars, finalChars, positions);

          // Assert
          expect(out).toBe(flags);
        },
      ),
    );
  });
});
