import fc from '../../../../lib/fast-check';
import {
  assertProduceValuesShrinkableWithoutContext,
  assertProduceCorrectValues,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesStrictlySmallerValue,
  assertProduceSameValueGivenSameSeed,
} from '../../check/arbitrary/generic/NextArbitraryAssertions';
import { MixedCaseArbitrary } from '../../../../src/arbitrary/_internals/MixedCaseArbitrary';
import { stringOf } from '../../../../src/arbitrary/stringOf';
import { nat } from '../../../../src/arbitrary/nat';
import { convertFromNext, convertToNext } from '../../../../src/check/arbitrary/definition/Converters';

describe('MixedCaseArbitrary (integration)', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }

  type Extra = { withoutToggle: boolean };
  const extraParameters: fc.Arbitrary<Extra> = fc.record({ withoutToggle: fc.boolean() });
  const mixedCaseBaseChars = ['0', '1', 'A', 'B'];

  const isCorrect = (value: string, extra: Extra) => {
    const acceptedChars = extra.withoutToggle
      ? mixedCaseBaseChars
      : [...mixedCaseBaseChars, ...mixedCaseBaseChars.map((c) => c.toLowerCase())];
    return typeof value === 'string' && [...value].every((c) => acceptedChars.includes(c));
  };

  const isStrictlySmaller = (v1: string, v2: string) => v1.length < v2.length || v1 < v2; /* '0' < 'A' < 'a' */

  const mixedCaseBuilder = (extra: Extra) =>
    new MixedCaseArbitrary(
      convertToNext(
        stringOf(
          convertFromNext(
            convertToNext(nat(mixedCaseBaseChars.length - 1)).map(
              (id) => mixedCaseBaseChars[id],
              (c) => mixedCaseBaseChars.indexOf(c as string)
            )
          )
        )
      ),
      extra.withoutToggle ? (rawChar) => rawChar : (rawChar) => rawChar.toLowerCase(),
      (rawString) => rawString.toUpperCase()
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
