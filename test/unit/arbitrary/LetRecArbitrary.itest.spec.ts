import { letrec as letrecOld } from '../../../src/arbitrary/letrec';
import { NextArbitrary } from '../../../src/check/arbitrary/definition/NextArbitrary';
import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';

import { convertFromNext, convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { FakeIntegerArbitrary } from '../check/arbitrary/generic/NextArbitraryHelpers';
import {
  assertGenerateEquivalentTo,
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
} from '../check/arbitrary/generic/NextArbitraryAssertions';

// Temporary rewrapping around letrec
// Should be removed with next major (no more Arbitrary, only NextArbitrary)
export function letrec<T>(
  builder: (tie: (key: string) => NextArbitrary<unknown>) => { [K in keyof T]: NextArbitrary<T[K]> }
): { [K in keyof T]: NextArbitrary<T[K]> } {
  const outOld = letrecOld((tieOld) => {
    const tie: (key: string) => NextArbitrary<unknown> = (key) => convertToNext(tieOld(key));
    const built = builder(tie);
    const revampedBuilt: { [K in keyof T]: Arbitrary<T[K]> } = Object.create(null);
    for (const k of Object.keys(built)) {
      revampedBuilt[k as keyof T] = convertFromNext(built[k as keyof T]);
    }
    return revampedBuilt;
  });
  const out: { [K in keyof T]: NextArbitrary<T[K]> } = Object.create(null);
  for (const k of Object.keys(outOld)) {
    out[k as keyof T] = convertToNext(outOld[k as keyof T]);
  }
  return out;
}

describe('letrec', () => {
  const letrecBuilder = () => {
    const { a } = letrec((tie) => ({
      a: tie('b'),
      b: tie('c'),
      c: new FakeIntegerArbitrary(),
    }));
    return a;
  };

  it('should generate the values as-if we directly called the target arbitrary', () => {
    assertGenerateEquivalentTo(letrecBuilder, () => new FakeIntegerArbitrary(), {
      isEqualContext: (c1, c2) => {
        expect(c2).toEqual(c1);
      },
    });
  });

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(letrecBuilder);
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(letrecBuilder);
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(letrecBuilder);
  });

  it('should be able to shrink without any context if underlyings do', () => {
    assertShrinkProducesSameValueWithoutInitialContext(letrecBuilder);
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(letrecBuilder);
  });
});
