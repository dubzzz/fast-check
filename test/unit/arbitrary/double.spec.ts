import * as fc from '../../../lib/fast-check';
import { double } from '../../../src/arbitrary/double';

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

describe('double (integration)', () => {
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

  // v1 === v2 is required for cases in which min and max are too close and result in shrinks being too close from each others
  const isSmallerOrEqual = (v1: number, v2: number) => Math.abs(v1) <= Math.abs(v2) || v1 === v2;

  const doubleBuilder = (extra: Extra) => convertToNext(double(extra));

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(doubleBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(doubleBuilder, isCorrect, { extraParameters });
  });

  it('should shrink towards smaller values', () => {
    assertShrinkProducesStrictlySmallerValue(doubleBuilder, isSmallerOrEqual, { extraParameters });
  });
});
