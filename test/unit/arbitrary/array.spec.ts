import * as fc from '../../../lib/fast-check';
import { array } from '../../../src/arbitrary/array';

import { FakeIntegerArbitrary, fakeNextArbitrary } from './__test-helpers__/NextArbitraryHelpers';

import * as ArrayArbitraryMock from '../../../src/arbitrary/_internals/ArrayArbitrary';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesStrictlySmallerValue,
} from './__test-helpers__/NextArbitraryAssertions';
import { isStrictlySmallerArray } from './__test-helpers__/ArrayHelpers';
import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';
import { buildNextShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('array', () => {
  it('should instantiate ArrayArbitrary(arb, 0, ?) for array(arb)', () => {
    // Arrange
    const { instance: childInstance } = fakeNextArbitrary<unknown>();
    const { instance } = fakeNextArbitrary<unknown[]>();
    const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
    ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

    // Act
    const arb = array(childInstance);

    // Assert
    expect(ArrayArbitrary).toHaveBeenCalledWith(childInstance, 0, expect.any(Number));
    const receivedMaxLength = ArrayArbitrary.mock.calls[0][2]; // Expecting the real value would check an implementation detail
    expect(receivedMaxLength).toBeGreaterThan(0);
    expect(receivedMaxLength).toBeLessThanOrEqual(2 ** 31 - 1);
    expect(Number.isInteger(receivedMaxLength)).toBe(true);
    expect(arb).toBe(instance);
  });

  it('should instantiate ArrayArbitrary(arb, 0, maxLength) for array(arb, {maxLength})', () => {
    fc.assert(
      fc.property(fc.nat({ max: 2 ** 31 - 1 }), (maxLength) => {
        // Arrange
        const { instance: childInstance } = fakeNextArbitrary<unknown>();
        const { instance } = fakeNextArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

        // Act
        const arb = array(childInstance, { maxLength });

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(childInstance, 0, maxLength);
        expect(arb).toBe(instance);
      })
    );
  });

  it('should instantiate ArrayArbitrary(arb, minLength, ?) for array(arb, {minLength})', () => {
    fc.assert(
      fc.property(fc.nat({ max: 2 ** 31 - 1 }), (minLength) => {
        // Arrange
        const { instance: childInstance } = fakeNextArbitrary<unknown>();
        const { instance } = fakeNextArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

        // Act
        const arb = array(childInstance, { minLength });

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(childInstance, minLength, expect.any(Number));
        const receivedMaxLength = ArrayArbitrary.mock.calls[0][2]; // Expecting the real value would check an implementation detail
        if (minLength !== 2 ** 31 - 1) {
          expect(receivedMaxLength).toBeGreaterThan(minLength);
          expect(receivedMaxLength).toBeLessThanOrEqual(2 ** 31 - 1);
          expect(Number.isInteger(receivedMaxLength)).toBe(true);
        } else {
          expect(receivedMaxLength).toEqual(minLength);
        }
        expect(arb).toBe(instance);
      })
    );
  });

  it('should instantiate ArrayArbitrary(arb, minLength, maxLength) for array(arb, {minLength,maxLength})', () => {
    fc.assert(
      fc.property(fc.nat({ max: 2 ** 31 - 1 }), fc.nat({ max: 2 ** 31 - 1 }), (aLength, bLength) => {
        // Arrange
        const [minLength, maxLength] = aLength < bLength ? [aLength, bLength] : [bLength, aLength];
        const { instance: childInstance } = fakeNextArbitrary<unknown>();
        const { instance } = fakeNextArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

        // Act
        const arb = array(childInstance, { minLength, maxLength });

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(childInstance, minLength, maxLength);
        expect(arb).toBe(instance);
      })
    );
  });

  it('should throw when minimum length is greater than maximum one', () => {
    fc.assert(
      fc.property(fc.nat({ max: 2 ** 31 - 1 }), fc.nat({ max: 2 ** 31 - 1 }), (aLength, bLength) => {
        // Arrange
        fc.pre(aLength !== bLength);
        const [minLength, maxLength] = aLength < bLength ? [bLength, aLength] : [aLength, bLength];
        const { instance: childInstance } = fakeNextArbitrary<unknown>();

        // Act / Assert
        expect(() => array(childInstance, { minLength, maxLength })).toThrowError();
      })
    );
  });
});

describe('array (integration)', () => {
  type Extra = { minLength?: number; maxLength?: number };
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(fc.nat({ max: 5 }), fc.nat({ max: 30 }), fc.boolean(), fc.boolean())
    .map(([min, gap, withMin, withMax]) => ({
      minLength: withMin ? min : undefined,
      maxLength: withMax ? min + gap : undefined,
    }));

  const isCorrect = (value: number[], extra: Extra) => {
    if (extra.minLength !== undefined) {
      expect(value.length).toBeGreaterThanOrEqual(extra.minLength);
    }
    if (extra.maxLength !== undefined) {
      expect(value.length).toBeLessThanOrEqual(extra.maxLength);
    }
    for (const v of value) {
      expect(typeof v).toBe('number');
    }
  };

  const isStrictlySmaller = isStrictlySmallerArray;

  const arrayBuilder = (extra: Extra) => array(new FakeIntegerArbitrary(), extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(arrayBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(arrayBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(arrayBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(arrayBuilder, { extraParameters });
  });

  it('should preserve strictly smaller ordering in shrink', () => {
    assertShrinkProducesStrictlySmallerValue(arrayBuilder, isStrictlySmaller, { extraParameters });
  });

  it.each`
    rawValue                 | minLength
    ${[2, 4, 8, 16, 32, 64]} | ${undefined}
    ${[2, 4, 8]}             | ${undefined}
    ${[2, 4, 8]}             | ${2}
    ${[2, 4, 8]}             | ${3}
  `('should be able to shrink $rawValue given constraints minLength:$minLength', ({ rawValue, minLength }) => {
    // Arrange
    const constraints = { minLength };
    const arb = array(new FakeIntegerArbitrary(0, 1000), constraints);
    const value = new NextValue(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});
