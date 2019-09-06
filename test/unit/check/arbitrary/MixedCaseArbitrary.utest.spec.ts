import * as fc from '../../../../lib/fast-check';

import { countToggledBits, computeNextFlags } from '../../../../src/check/arbitrary/MixedCaseArbitrary';

declare function BigInt(n: number | bigint | string): bigint;

describe('MixedCaseArbitrary', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }
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
      const flags = BigInt(243); // 11110011
      expect(computeNextFlags(flags, 8, 8)).toBe(flags);
    });
    it('should just remove last non toggled bits if number of ending zero is enough', () => {
      const flags = BigInt(242); // 11110010
      const expectedFlags = BigInt(121); // 1111001
      expect(computeNextFlags(flags, 8, 7)).toBe(expectedFlags);
    });
    it('should pad with zeros for longer izes', () => {
      const flags = BigInt(242); // 11110010
      const expectedFlags = BigInt(484); // 111100100
      expect(computeNextFlags(flags, 8, 9)).toBe(expectedFlags);
    });
    it('should keep the same number of toggled flags for flags not existing anymore', () => {
      const flags = BigInt(147); // 10010011
      const expectedFlags = BigInt(75); // 1001011
      expect(computeNextFlags(flags, 8, 7)).toBe(expectedFlags);
    });
    it('should properly deal with cases where flags have to be removed', () => {
      const flags = BigInt(243); // 11110011
      const expectedFlags = BigInt(3); // 11
      expect(computeNextFlags(flags, 8, 2)).toBe(expectedFlags);
    });
    it('should preserve the same number of toggled positions', () =>
      fc.assert(
        fc.property(fc.bigUintN(50), fc.nat(100), (flags, offset) => {
          const sourceToggled = countToggledBits(flags);
          const nextSize = sourceToggled + offset; // anything >= sourceToggled
          const nextFlags = computeNextFlags(flags, 50, nextSize);
          expect(countToggledBits(nextFlags)).toBe(sourceToggled);
        })
      ));
    it('should preserve the position of existing toggled values', () =>
      fc.assert(
        fc.property(fc.bigUintN(50), fc.integer(1, 100), (flags, nextSize) => {
          const nextFlags = computeNextFlags(flags, 50, nextSize);
          for (let idx = 0, mask = BigInt(1); idx !== nextSize; ++idx, mask <<= BigInt(1)) {
            if (flags & mask) expect(!!(nextFlags & mask)).toBe(true);
          }
        })
      ));
    it('should not return flags larger than the asked size', () =>
      fc.assert(
        fc.property(fc.bigUintN(50), fc.nat(100), (flags, nextSize) => {
          const nextFlags = computeNextFlags(flags, 50, nextSize);
          expect(nextFlags < BigInt(1) << BigInt(nextSize)).toBe(true);
        })
      ));
  });
});
