import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import {
  assertProduceValuesShrinkableWithoutContext,
  assertProduceCorrectValues,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesStrictlySmallerValue,
  assertProduceSameValueGivenSameSeed,
} from '../__test-helpers__/ArbitraryAssertions';
import { MixedCaseArbitrary } from '../../../../src/arbitrary/_internals/MixedCaseArbitrary';
import { string } from '../../../../src/arbitrary/string';
import { nat } from '../../../../src/arbitrary/nat';
import * as BigUintNMock from '../../../../src/arbitrary/bigUintN';
import { fakeArbitrary } from '../__test-helpers__/ArbitraryHelpers';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { fakeRandom } from '../__test-helpers__/RandomHelpers';
import { declareCleaningHooksForSpies } from '../__test-helpers__/SpyCleaner';

describe('MixedCaseArbitrary', () => {
  declareCleaningHooksForSpies();

  describe('generate', () => {
    it('should not toggle any character if flags equal zero', () => {
      // Arrange
      const { instance: mrng } = fakeRandom();
      const { bigUintN, stringInstance } = mockSourceArbitrariesForGenerate(BigInt(0), 'azerty');
      const toggleCase = vi.fn().mockImplementation((c) => c.toUpperCase());
      const untoggleAll = vi.fn().mockImplementation((s) => s.toLowerCase());

      // Act
      const arb = new MixedCaseArbitrary(stringInstance, toggleCase, untoggleAll);
      const g = arb.generate(mrng, undefined);

      // Assert
      expect(g.value).toBe('azerty');
      expect(bigUintN).toHaveBeenCalledWith(6); // num toggleable chars in string = 6
      expect(toggleCase).toHaveBeenCalledTimes(6); // length string = 6, to be toggled = 0
      expect(untoggleAll).not.toHaveBeenCalled();
    });

    it('should toggle characters according to flags', () => {
      // Arrange
      const { instance: mrng } = fakeRandom();
      const { bigUintN, stringInstance } = mockSourceArbitrariesForGenerate(BigInt(9) /* 001001 */, 'azerty');
      const toggleCase = vi.fn().mockImplementation((c) => c.toUpperCase());
      const untoggleAll = vi.fn().mockImplementation((s) => s.toLowerCase());

      // Act
      const arb = new MixedCaseArbitrary(stringInstance, toggleCase, untoggleAll);
      const g = arb.generate(mrng, undefined);

      // Assert
      expect(g.value).toBe('azErtY');
      expect(bigUintN).toHaveBeenCalledWith(6); // num toggleable chars in string = 6
      expect(toggleCase).toHaveBeenCalledTimes(6 + 2); // length string = 6, to be toggled = 2
      expect(untoggleAll).not.toHaveBeenCalled();
    });

    it('should not try to toggle characters that do not have toggled versions', () => {
      // Arrange
      const { instance: mrng } = fakeRandom();
      const { bigUintN, stringInstance } = mockSourceArbitrariesForGenerate(BigInt(10) /* 1010 */, 'az01ty');
      const toggleCase = vi.fn().mockImplementation((c) => c.toUpperCase());
      const untoggleAll = vi.fn().mockImplementation((s) => s.toLowerCase());

      // Act
      const arb = new MixedCaseArbitrary(stringInstance, toggleCase, untoggleAll);
      const g = arb.generate(mrng, undefined);

      // Assert
      expect(g.value).toBe('Az01Ty');
      expect(bigUintN).toHaveBeenCalledWith(4); // // num toggleable chars in string = 4 as 01 upper version is the same -> only 4 can be toggled not 6
      expect(toggleCase).toHaveBeenCalledTimes(6 + 2); // length string = 6, to be toggled = 2
      expect(untoggleAll).not.toHaveBeenCalled();
    });

    it('should properly deal with toggle mapping to multiple characters', () => {
      // Arrange
      const { instance: mrng } = fakeRandom();
      const { bigUintN, stringInstance } = mockSourceArbitrariesForGenerate(BigInt(63) /* 111111 */, 'azerty');
      const toggleCase = vi.fn().mockImplementation((c: string) => {
        if (c === 'a' || c === 't') return '<Hello>';
        else return c;
      });
      const untoggleAll = vi.fn().mockImplementation((s) => s.toLowerCase());

      // Act
      const arb = new MixedCaseArbitrary(stringInstance, toggleCase, untoggleAll);
      const g = arb.generate(mrng, undefined);

      // Assert
      expect(g.value).toBe('<Hello>zer<Hello>y');
      expect(bigUintN).toHaveBeenCalledWith(2); // num toggleable chars in string = 2, only a and t
      expect(toggleCase).toHaveBeenCalledTimes(6 + 2); // length string = 6, to be toggled = 2
      expect(untoggleAll).not.toHaveBeenCalled();
    });
  });

  describe('canShrinkWithoutContext', () => {
    it('should always check against the arbitrary of string with raw when no untoggleAll', () => {
      fc.assert(
        fc.property(fc.string(), fc.boolean(), fc.func(fc.string()), (rawValue, isShrinkable, toggleCase) => {
          // Arrange
          const { instance, canShrinkWithoutContext } = fakeArbitrary();
          canShrinkWithoutContext.mockReturnValueOnce(isShrinkable);

          // Act
          const arb = new MixedCaseArbitrary(instance, toggleCase, undefined);
          const out = arb.canShrinkWithoutContext(rawValue);

          // Assert
          expect(out).toBe(isShrinkable);
          expect(canShrinkWithoutContext).toHaveBeenCalledTimes(1);
          expect(canShrinkWithoutContext).toHaveBeenCalledWith(rawValue);
        }),
      );
    });

    it('should always check against the arbitrary of string with untoggled when untoggleAll', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          fc.boolean(),
          fc.func(fc.string()),
          (rawValue, untoggledValue, isShrinkable, toggleCase) => {
            // Arrange
            const { instance, canShrinkWithoutContext } = fakeArbitrary();
            canShrinkWithoutContext.mockReturnValueOnce(isShrinkable);
            const untoggleAll = vi.fn();
            untoggleAll.mockReturnValue(untoggledValue);

            // Act
            const arb = new MixedCaseArbitrary(instance, toggleCase, untoggleAll);
            const out = arb.canShrinkWithoutContext(rawValue);

            // Assert
            expect(out).toBe(isShrinkable);
            expect(canShrinkWithoutContext).toHaveBeenCalledTimes(1);
            expect(canShrinkWithoutContext).toHaveBeenCalledWith(untoggledValue);
          },
        ),
      );
    });
  });
});

describe('MixedCaseArbitrary (integration)', () => {
  type Extra = { withoutToggle: boolean };
  const extraParameters: fc.Arbitrary<Extra> = fc.record({ withoutToggle: fc.boolean() });
  const mixedCaseBaseChars = ['A', 'B', '|', '~'];

  const isCorrect = (value: string, extra: Extra) => {
    const acceptedChars = extra.withoutToggle
      ? mixedCaseBaseChars
      : [...mixedCaseBaseChars, ...mixedCaseBaseChars.map((c) => c.toLowerCase())];
    return typeof value === 'string' && [...value].every((c) => acceptedChars.includes(c));
  };

  const isStrictlySmaller = (v1: string, v2: string) => v1.length < v2.length || v1 < v2; /* 'A' < 'a' < '|' < '~' */

  const mixedCaseBuilder = (extra: Extra) =>
    new MixedCaseArbitrary(
      string({
        unit: nat(mixedCaseBaseChars.length - 1).map(
          (id) => mixedCaseBaseChars[id],
          (c) => mixedCaseBaseChars.indexOf(c as string),
        ),
      }),
      extra.withoutToggle ? (rawChar) => rawChar : (rawChar) => rawChar.toLowerCase(),
      (rawString) => rawString.toUpperCase(),
    );

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(mixedCaseBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(mixedCaseBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(mixedCaseBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context (if underlyings do)', () => {
    assertShrinkProducesSameValueWithoutInitialContext(mixedCaseBuilder, { extraParameters });
  });

  it('should preserve strictly smaller ordering in shrink (if underlyings do)', () => {
    assertShrinkProducesStrictlySmallerValue(mixedCaseBuilder, isStrictlySmaller, { extraParameters });
  });
});

// Helpers

function mockSourceArbitrariesForGenerate(bigIntOutput: bigint, stringOutput: string) {
  const { instance: bigUintNInstance, generate: bigUintNGenerate } = fakeArbitrary();
  const bigUintN = vi.spyOn(BigUintNMock, 'bigUintN');
  bigUintN.mockReturnValue(bigUintNInstance);
  bigUintNGenerate.mockReturnValueOnce(new Value(bigIntOutput, undefined));
  const { instance: stringInstance, generate: stringGenerate } = fakeArbitrary();
  stringGenerate.mockReturnValueOnce(new Value(stringOutput, undefined));
  return { bigUintN, stringInstance };
}
