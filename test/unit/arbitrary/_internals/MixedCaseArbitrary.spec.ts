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
import { convertToNext } from '../../../../src/check/arbitrary/definition/Converters';
import fc from '../../../../lib/fast-check';

describe('MixedCaseArbitrary (integration)', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }

  type Extra = { withoutToggle: boolean };
  const extraParameters: fc.Arbitrary<Extra> = fc.record({ withoutToggle: fc.boolean() });

  const isCorrect = (value: string, extra: Extra) => {
    const acceptedChars = extra.withoutToggle ? '01AB' : '01abAB';
    return typeof value === 'string' && [...value].every((c) => acceptedChars.includes(c));
  };

  const isStrictlySmaller = (v1: string, v2: string) => v1.length < v2.length || v1 < v2; /* '0' < 'A' < 'a' */

  const mixedCaseBuilder = (extra: Extra) =>
    new MixedCaseArbitrary(
      convertToNext(stringOf(nat(3).map((id) => ['0', '1', 'A', 'B'][id]))),
      extra.withoutToggle ? (rawChar) => rawChar : (rawChar) => rawChar.toLowerCase()
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
