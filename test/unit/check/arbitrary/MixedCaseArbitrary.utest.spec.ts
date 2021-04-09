import * as fc from '../../../../lib/fast-check';

import { mixedCase, countToggledBits, computeNextFlags } from '../../../../src/check/arbitrary/MixedCaseArbitrary';

jest.mock('../../../../src/arbitrary/bigUintN');
import * as BigUintNMock from '../../../../src/arbitrary/bigUintN';
import * as stubRng from '../../stubs/generators';
import { mocked } from 'ts-jest/utils';
import { arbitraryFor } from './generic/ArbitraryBuilder';

const mrng = () => stubRng.mutable.nocall();

declare function BigInt(n: number | bigint | string): bigint;

describe('MixedCaseArbitrary', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }
  describe('mixedCase', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('should not toggle any character if flags are null', () => {
      // Arrange
      const { bigUintN } = mocked(BigUintNMock);
      bigUintN.mockImplementationOnce((_n) => arbitraryFor([{ value: BigInt(0) }]));
      const stringArb = arbitraryFor([{ value: 'azerty' }]);

      // Act
      const arb = mixedCase(stringArb);
      const { value_: s } = arb.generate(mrng());

      // Assert
      expect(s).toBe('azerty');
      expect(bigUintN).toHaveBeenCalledWith(6);
    });
    it('should toggle characters according to flags', () => {
      // Arrange
      const { bigUintN } = mocked(BigUintNMock);
      bigUintN.mockImplementationOnce((_n) => arbitraryFor([{ value: BigInt(9) /* 001001 */ }]));
      const stringArb = arbitraryFor([{ value: 'azerty' }]);

      // Act
      const arb = mixedCase(stringArb);
      const { value_: s } = arb.generate(mrng());

      // Assert
      expect(s).toBe('AzeRty');
      expect(bigUintN).toHaveBeenCalledWith(6);
    });
    it('should toggle both lower and upper characters', () => {
      // Arrange
      const { bigUintN } = mocked(BigUintNMock);
      bigUintN.mockImplementationOnce((_n) => arbitraryFor([{ value: BigInt(9) /* 001001 */ }]));
      const stringArb = arbitraryFor([{ value: 'azERty' }]);

      // Act
      const arb = mixedCase(stringArb);
      const { value_: s } = arb.generate(mrng());

      // Assert
      expect(s).toBe('AzErty');
      expect(bigUintN).toHaveBeenCalledWith(6);
    });
    it('should not try to toggle characters that do not have lower/upper versions', () => {
      // Arrange
      const { bigUintN } = mocked(BigUintNMock);
      bigUintN.mockImplementationOnce((_n) => arbitraryFor([{ value: BigInt(0) }]));
      const stringArb = arbitraryFor([{ value: 'az01ty' }]); // 01 upper version is the same

      // Act
      const arb = mixedCase(stringArb);
      const { value_: s } = arb.generate(mrng());

      // Assert
      expect(s).toBe('az01ty');
      expect(bigUintN).toHaveBeenCalledWith(4);
    });
    it('should shrink by merging string and flags shrinkers', () => {
      // Arrange
      const { bigUintN } = mocked(BigUintNMock);
      bigUintN.mockImplementation((n) => {
        switch (n) {
          case 6: // azerty
            return arbitraryFor([
              {
                value: BigInt(0b100100),
                shrinks: [
                  { value: BigInt(0b000100), shrinks: [{ value: BigInt(0b100000) }] },
                  { value: BigInt(0b000000) },
                ],
              },
            ]);
          case 3: // aze
            return arbitraryFor([{ value: BigInt(0b010), shrinks: [{ value: BigInt(0b000) }] }]);
          case 4: // azer
            return arbitraryFor([
              { value: BigInt(0b1011), shrinks: [{ value: BigInt(0b1111) }, { value: BigInt(0b1000) }] },
              { value: BigInt(0b0101), shrinks: [{ value: BigInt(0b0011) }, { value: BigInt(0b0010) }] },
            ]);
          case 0: //
          default:
            return arbitraryFor([{ value: BigInt(0) }]);
        }
      });
      const stringArb = arbitraryFor([
        {
          value: 'azerty',
          shrinks: [
            { value: 'aze', shrinks: [{ value: '' }] },
            { value: 'azer', shrinks: [{ value: 'az' }, { value: '' }] },
          ],
        },
      ]);

      // Act
      const arb = mixedCase(stringArb);
      const s0 = arb.generate(mrng());
      const level0 = s0.value_;
      const level1 = [...s0.shrink().map((s) => s.value_)];
      const s1a = s0.shrink().getNthOrLast(1)!;
      const level2a = [...s1a.shrink().map((s) => s.value_)];
      const s1b = s0.shrink().getNthOrLast(2)!;
      const level2b = [...s1b.shrink().map((s) => s.value_)];

      // Assert
      expect(level0).toEqual('azErtY' /*azerty + 100100*/);
      expect(level1).toEqual([
        'AzE' /*aze + 101*/,
        'AzEr' /*azer + 0101*/, // <-- string shrinker for 'azerty'
        'azErty' /*azerty + 000100*/,
        'azerty' /*azerty + 000000*/, // <-- bigint shrinker for bigUintN(6)[0b100100]
      ]);
      expect(level2a).toEqual([
        'AZ' /*az + 11*/,
        '' /* + */, // <-- string shrinker for 'azer'
        'AZer' /*azer + 0011*/,
        'aZer' /*azer + 0010*/, // <-- bigint shrinker for bigUintN(4)[0b0101]
      ]);
      expect(level2b).toEqual([
        // 'azE' /*aze + 100*/,
        // 'azEr' /*azer + 0100*/, // <-- string shrinker for 'azerty' (removed)
        'azertY' /*azerty + 100000*/, // <-- bigint shrinker for bigUintN(6)[0b000100]
      ]);
    });
    it('should use toggle function when provided to check what can be toggled or not', () => {
      // Arrange
      const { bigUintN } = mocked(BigUintNMock);
      bigUintN.mockImplementationOnce((_n) => arbitraryFor([{ value: BigInt(63) /* 111111 */ }]));
      const stringArb = arbitraryFor([{ value: 'azerty' }]);
      const customToggle = jest.fn();
      customToggle.mockImplementation((c: string) => {
        if (c === 'a' || c === 't') return '<Hello>';
        else return c;
      });

      // Act
      const arb = mixedCase(stringArb, { toggleCase: customToggle });
      const { value_: s } = arb.generate(mrng());

      // Assert
      expect(s).toBe('<Hello>zer<Hello>y');
      expect(bigUintN).toHaveBeenCalledWith(2);
    });
  });
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
    it('should preserve the same number of flags', () =>
      fc.assert(
        fc.property(fc.bigUint(), fc.nat(100), (flags, offset) => {
          const sourceToggled = countToggledBits(flags);
          const nextSize = sourceToggled + offset; // anything >= sourceToggled
          const nextFlags = computeNextFlags(flags, nextSize);
          expect(countToggledBits(nextFlags)).toBe(sourceToggled);
        })
      ));
    it('should preserve the position of existing flags', () =>
      fc.assert(
        fc.property(fc.bigUint(), fc.integer(1, 100), (flags, nextSize) => {
          const nextFlags = computeNextFlags(flags, nextSize);
          for (let idx = 0, mask = BigInt(1); idx !== nextSize; ++idx, mask <<= BigInt(1)) {
            if (flags & mask) expect(!!(nextFlags & mask)).toBe(true);
          }
        })
      ));
    it('should not return flags larger than the asked size', () =>
      fc.assert(
        fc.property(fc.bigUint(), fc.nat(100), (flags, nextSize) => {
          const nextFlags = computeNextFlags(flags, nextSize);
          expect(nextFlags < BigInt(1) << BigInt(nextSize)).toBe(true);
        })
      ));
  });
});
