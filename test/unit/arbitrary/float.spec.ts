import * as fc from '../../../lib/fast-check';
import { float } from '../../../src/arbitrary/float';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import {
  assertProduceCorrectValues,
  assertShrinkProducesStrictlySmallerValue,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/NextArbitraryAssertions';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('float (integration)', () => {
  type Extra = { min?: number; max?: number };
  const extraParameters: fc.Arbitrary<Extra> = fc.oneof(
    // no min, no max
    fc.constant({}),
    // only min (min [included], max=1)
    fc.nat({ max: 99 }).map((v) => ({ min: v / 100.0 })),
    // only max (max [excluded])
    fc.nat().map((v) => ({ max: (v + 1) / 100.0 })),
    // both min and max (min [included], max [excluded])
    fc
      .tuple(fc.nat(), fc.nat())
      .filter(([a, b]) => a !== b)
      .map(([a, b]) => (a < b ? { min: a / 100.0, max: b / 100.0 } : { min: b / 100.0, max: a / 100.0 }))
  );

  const isCorrect = (value: number, extra: Extra) => {
    const { min = 0, max = 1 } = extra;
    typeof value === 'number' && min <= value && value < max;
  };

  const isStrictlySmaller = (v1: number, v2: number) => Math.abs(v1) < Math.abs(v2);

  const floatBuilder = (extra: Extra) => convertToNext(float(extra));

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(floatBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(floatBuilder, isCorrect, { extraParameters });
  });

  it('should shrink towards strictly smaller values', () => {
    assertShrinkProducesStrictlySmallerValue(floatBuilder, isStrictlySmaller, { extraParameters });
  });
});
