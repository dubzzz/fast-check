import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  applyFlagsOnChars,
  computeFlagsFromChars,
  computeNextFlags,
  computeTogglePositions,
  countToggledBits,
} from '../../../../../src/arbitrary/_internals/helpers/ToggleFlags';

describe('countToggledBits', () => {
  it('should properly count when zero bits are toggled', () => {
    expect(countToggledBits(BigInt(0))).toBe(0);
  });

  it('should properly count when all bits are toggled', () => {
    expect(countToggledBits(BigInt(0xffffffff))).toBe(32);
  });

  it('should properly count when part of the bits are toggled', () => {
    expect(countToggledBits(BigInt(7456))).toBe(5);
  });
});

describe('computeNextFlags', () => {
  it('should keep the same flags if size has not changed', () => {
    const flags = BigInt(243); // 11110011 -> 11110011
    expect(computeNextFlags(flags, 8)).toBe(flags);
  });

  it('should keep the same flags if number of starting zeros is enough', () => {
    const flags = BigInt(121); // 01111001 -> 1111001
    expect(computeNextFlags(flags, 7)).toBe(flags);
  });

  it('should keep the same flags if size is longer', () => {
    const flags = BigInt(242); // 11110010 -> 011110010
    expect(computeNextFlags(flags, 9)).toBe(flags);
  });

  it('should keep the same number of toggled flags for flags not existing anymore', () => {
    const flags = BigInt(147); // 10010011
    const expectedFlags = BigInt(23); // 0010111 - start by filling by the right
    expect(computeNextFlags(flags, 7)).toBe(expectedFlags);
  });

  it('should properly deal with cases where flags have to be removed', () => {
    const flags = BigInt(243); // 11110011
    const expectedFlags = BigInt(3); // 11
    expect(computeNextFlags(flags, 2)).toBe(expectedFlags);
  });

  it('should preserve the same number of flags', () => {
    fc.assert(
      fc.property(fc.bigUint(), fc.nat(100), (flags, offset) => {
        const sourceToggled = countToggledBits(flags);
        const nextSize = sourceToggled + offset; // anything >= sourceToggled
        const nextFlags = computeNextFlags(flags, nextSize);
        expect(countToggledBits(nextFlags)).toBe(sourceToggled);
      }),
    );
  });

  it('should preserve the position of existing flags', () => {
    fc.assert(
      fc.property(fc.bigUint(), fc.integer({ min: 1, max: 100 }), (flags, nextSize) => {
        const nextFlags = computeNextFlags(flags, nextSize);
        for (let idx = 0, mask = BigInt(1); idx !== nextSize; ++idx, mask <<= BigInt(1)) {
          if (flags & mask) expect(!!(nextFlags & mask)).toBe(true);
        }
      }),
    );
  });

  it('should not return flags larger than the asked size', () => {
    fc.assert(
      fc.property(fc.bigUint(), fc.nat(100), (flags, nextSize) => {
        const nextFlags = computeNextFlags(flags, nextSize);
        expect(nextFlags < BigInt(1) << BigInt(nextSize)).toBe(true);
      }),
    );
  });
});

describe('computeTogglePositions', () => {
  it('should properly tag toggleable positions', () => {
    fc.assert(
      fc.property(fc.array(fc.char()), fc.func(fc.char()), (chars, toggleCase) => {
        // Arrange / Act
        const positions = computeTogglePositions(chars, toggleCase);

        // Assert
        for (const p of positions) {
          expect(toggleCase(chars[p])).not.toBe(chars[p]);
        }
      }),
    );
  });

  it('should not tag untoggleable positions', () => {
    fc.assert(
      fc.property(fc.array(fc.char()), fc.func(fc.char()), (chars, toggleCase) => {
        // Arrange / Act
        const positions = computeTogglePositions(chars, toggleCase);

        // Assert
        for (let index = 0; index !== chars.length; ++index) {
          if (!positions.includes(index)) {
            expect(toggleCase(chars[index])).toBe(chars[index]);
          }
        }
      }),
    );
  });
});

describe('computeFlagsFromChars', () => {
  it('should be able to find back flags out of source and final chars', () => {
    fc.assert(
      fc.property(fc.array(fc.char()), fc.func(fc.char()), fc.bigUint(), (chars, toggleCase, flagsUnmasked) => {
        // Arrange
        const positions = computeTogglePositions(chars, toggleCase);
        const mask = (BigInt(1) << BigInt(positions.length)) - BigInt(1);
        const flags = flagsUnmasked & mask;
        const finalChars = [...chars];
        applyFlagsOnChars(finalChars, flags, positions, toggleCase);

        // Act
        const out = computeFlagsFromChars(chars, finalChars, positions);

        // Assert
        expect(out).toBe(flags);
      }),
    );
  });
});
