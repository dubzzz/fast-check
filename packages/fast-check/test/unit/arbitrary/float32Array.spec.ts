import * as fc from 'fast-check';
import { float32Array, Float32ArrayConstraints } from '../../../src/arbitrary/float32Array';

import {
  assertValidArbitrary
} from './__test-helpers__/ArbitraryAssertions';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('float32Array (integration)', () => {
  type Extra = Float32ArrayConstraints;
  const extraParameters: fc.Arbitrary<Extra> = fc
    .record(
      {
        minLength: fc.nat({ max: 5 }),
        maxLength: fc.nat({ max: 25 }),
        min: fc.float({ noDefaultInfinity: true, noNaN: true }),
        max: fc.float({ noDefaultInfinity: true, noNaN: true }),
        noDefaultInfinity: fc.boolean(),
        noNaN: fc.boolean(),
      },
      { requiredKeys: [] },
    )
    .map((rawConstraints) => {
      const constraints = { ...rawConstraints };
      if ('minLength' in constraints && 'maxLength' in constraints && constraints.minLength! > constraints.maxLength!) {
        [constraints.minLength, constraints.maxLength] = [constraints.maxLength, constraints.minLength];
      }
      if ('min' in constraints && 'max' in constraints && strictlyLowerThan(constraints.max!, constraints.min!)) {
        [constraints.min, constraints.max] = [constraints.max, constraints.min];
      }
      return constraints;
    });

  const isCorrect = (value: Float32Array, extra: Extra) => {
    expect(value).toBeInstanceOf(Float32Array);
    if ('minLength' in extra) {
      expect(value.length).toBeGreaterThanOrEqual(extra.minLength!);
    }
    if ('maxLength' in extra) {
      expect(value.length).toBeLessThanOrEqual(extra.maxLength!);
    }
  };

  const float32ArrayBuilder = (extra: Extra) => float32Array(extra);

  it('should be a valid arbitrary', () => {
    assertValidArbitrary(
      float32ArrayBuilder,
      {
        sameValueGivenSameSeed: {},
        correctValues: { isCorrect },
        shrinkableWithoutContext: {},
        sameValueWithoutInitialContext: {},
      },
      { extraParameters },
    );
  });
});

// Helper

function strictlyLowerThan(a: number, b: number): boolean {
  return a < b || (a === b && Object.is(a, -0) && Object.is(b, 0));
}
