import * as fc from '../../../lib/fast-check';
import { float64Array, Float64ArrayConstraints } from '../../../src/arbitrary/float64Array';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';

import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  //assertProduceValuesShrinkableWithoutContext,
  //assertShrinkProducesSameValueWithoutInitialContext,
} from '../check/arbitrary/generic/NextArbitraryAssertions';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('float64Array (integration)', () => {
  type Extra = Float64ArrayConstraints;
  const extraParameters: fc.Arbitrary<Extra> = fc
    .record(
      {
        minLength: fc.nat({ max: 25 }),
        maxLength: fc.nat({ max: 25 }),
        min: fc.double({ next: true, noNaN: true }),
        max: fc.double({ next: true, noNaN: true }),
        noDefaultInfinity: fc.boolean(),
        noNaN: fc.boolean(),
      },
      { requiredKeys: [] }
    )
    .map((rawConstraints) => {
      const constraints = { ...rawConstraints };
      if ('minLength' in constraints && 'maxLength' in constraints && constraints.minLength! > constraints.maxLength!) {
        [constraints.minLength, constraints.maxLength] = [constraints.maxLength, constraints.minLength];
      }
      if ('min' in constraints && 'max' in constraints && constraints.min! > constraints.max!) {
        [constraints.min, constraints.max] = [constraints.max, constraints.min];
      }
      return constraints;
    });

  const isCorrect = (value: Float64Array, extra: Extra) => {
    expect(value).toBeInstanceOf(Float64Array);
    if ('minLength' in extra) {
      expect(value.length).toBeGreaterThanOrEqual(extra.minLength!);
    }
    if ('maxLength' in extra) {
      expect(value.length).toBeLessThanOrEqual(extra.maxLength!);
    }
  };

  const float64ArrayBuilder = (extra: Extra) => convertToNext(float64Array(extra));

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(float64ArrayBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(float64ArrayBuilder, isCorrect, { extraParameters });
  });

  //it('should produce values seen as shrinkable without any context', () => {
  //  assertProduceValuesShrinkableWithoutContext(typedIntArrayArbitraryArbitraryBuilderBuilder, { extraParameters });
  //});

  //it('should be able to shrink to the same values without initial context', () => {
  //  assertShrinkProducesSameValueWithoutInitialContext(typedIntArrayArbitraryArbitraryBuilderBuilder, {
  //    extraParameters,
  //  });
  //});
});
