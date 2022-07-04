import * as fc from 'fast-check';
import { array } from '../../../src/arbitrary/array';

import { FakeIntegerArbitrary, fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';

import * as ArrayArbitraryMock from '../../../src/arbitrary/_internals/ArrayArbitrary';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesStrictlySmallerValue,
} from './__test-helpers__/ArbitraryAssertions';
import { isStrictlySmallerArray } from './__test-helpers__/ArrayHelpers';
import { Value } from '../../../src/check/arbitrary/definition/Value';
import { buildShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';
import { sizeRelatedGlobalConfigArb } from './__test-helpers__/SizeHelpers';
import { withConfiguredGlobal } from './__test-helpers__/GlobalSettingsHelpers';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('array', () => {
  it('should instantiate ArrayArbitrary(arb, 0, ?, 0x7fffffff, n.a) for array(arb)', () => {
    fc.assert(
      fc.property(sizeRelatedGlobalConfigArb, (config) => {
        // Arrange
        const { instance: childInstance } = fakeArbitrary<unknown>();
        const { instance } = fakeArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

        // Act
        const arb = withConfiguredGlobal(config, () => array(childInstance));

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(childInstance, 0, expect.any(Number), 0x7fffffff, undefined);
        const receivedGeneratedMaxLength = ArrayArbitrary.mock.calls[0][2]; // Expecting the real value would check an implementation detail
        expect(receivedGeneratedMaxLength).toBeGreaterThan(0);
        expect(receivedGeneratedMaxLength).toBeLessThanOrEqual(2 ** 31 - 1);
        expect(Number.isInteger(receivedGeneratedMaxLength)).toBe(true);
        expect(arb).toBe(instance);
      })
    );
  });

  it('should instantiate ArrayArbitrary(arb, 0, ?, maxLength, n.a) for array(arb, {maxLength})', () => {
    fc.assert(
      fc.property(sizeRelatedGlobalConfigArb, fc.nat({ max: 2 ** 31 - 1 }), (config, maxLength) => {
        // Arrange
        const { instance: childInstance } = fakeArbitrary<unknown>();
        const { instance } = fakeArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

        // Act
        const arb = withConfiguredGlobal(config, () => array(childInstance, { maxLength }));

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(childInstance, 0, expect.any(Number), maxLength, undefined);
        const receivedGeneratedMaxLength = ArrayArbitrary.mock.calls[0][2]; // Expecting the real value would check an implementation detail
        expect(receivedGeneratedMaxLength).toBeGreaterThanOrEqual(0);
        expect(receivedGeneratedMaxLength).toBeLessThanOrEqual(maxLength);
        expect(Number.isInteger(receivedGeneratedMaxLength)).toBe(true);
        if (config.defaultSizeToMaxWhenMaxSpecified) {
          expect(ArrayArbitrary).toHaveBeenCalledWith(childInstance, 0, maxLength, maxLength, undefined);
        }
        expect(arb).toBe(instance);
      })
    );
  });

  it('should instantiate ArrayArbitrary(arb, minLength, ?, 0x7fffffff, n.a) for array(arb, {minLength})', () => {
    fc.assert(
      fc.property(sizeRelatedGlobalConfigArb, fc.nat({ max: 2 ** 31 - 1 }), (config, minLength) => {
        // Arrange
        const { instance: childInstance } = fakeArbitrary<unknown>();
        const { instance } = fakeArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

        // Act
        const arb = withConfiguredGlobal(config, () => array(childInstance, { minLength }));

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(
          childInstance,
          minLength,
          expect.any(Number),
          0x7fffffff,
          undefined
        );
        const receivedGeneratedMaxLength = ArrayArbitrary.mock.calls[0][2]; // Expecting the real value would check an implementation detail
        if (minLength !== 2 ** 31 - 1) {
          expect(receivedGeneratedMaxLength).toBeGreaterThan(minLength);
          expect(receivedGeneratedMaxLength).toBeLessThanOrEqual(2 ** 31 - 1);
          expect(Number.isInteger(receivedGeneratedMaxLength)).toBe(true);
        } else {
          expect(receivedGeneratedMaxLength).toEqual(minLength);
        }
        expect(arb).toBe(instance);
      })
    );
  });

  it('should instantiate ArrayArbitrary(arb, minLength, ?, maxLength, n.a) for array(arb, {minLength,maxLength})', () => {
    fc.assert(
      fc.property(
        sizeRelatedGlobalConfigArb,
        fc.nat({ max: 2 ** 31 - 1 }),
        fc.nat({ max: 2 ** 31 - 1 }),
        (config, aLength, bLength) => {
          // Arrange
          const [minLength, maxLength] = aLength < bLength ? [aLength, bLength] : [bLength, aLength];
          const { instance: childInstance } = fakeArbitrary<unknown>();
          const { instance } = fakeArbitrary<unknown[]>();
          const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
          ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

          // Act
          const arb = withConfiguredGlobal(config, () => array(childInstance, { minLength, maxLength }));

          // Assert
          expect(ArrayArbitrary).toHaveBeenCalledWith(
            childInstance,
            minLength,
            expect.any(Number),
            maxLength,
            undefined
          );
          const receivedGeneratedMaxLength = ArrayArbitrary.mock.calls[0][2]; // Expecting the real value would check an implementation detail
          expect(receivedGeneratedMaxLength).toBeGreaterThanOrEqual(minLength);
          expect(receivedGeneratedMaxLength).toBeLessThanOrEqual(maxLength);
          expect(Number.isInteger(receivedGeneratedMaxLength)).toBe(true);
          if (config.defaultSizeToMaxWhenMaxSpecified) {
            expect(ArrayArbitrary).toHaveBeenCalledWith(childInstance, minLength, maxLength, maxLength, undefined);
          }
          expect(arb).toBe(instance);
        }
      )
    );
  });

  it('should instantiate ArrayArbitrary(arb, minLength, ?, maxLength, identifier) for array(arb, {minLength,maxLength, depthIdentifier})', () => {
    fc.assert(
      fc.property(
        sizeRelatedGlobalConfigArb,
        fc.nat({ max: 2 ** 31 - 1 }),
        fc.nat({ max: 2 ** 31 - 1 }),
        fc.string(),
        (config, aLength, bLength, depthIdentifier) => {
          // Arrange
          const [minLength, maxLength] = aLength < bLength ? [aLength, bLength] : [bLength, aLength];
          const { instance: childInstance } = fakeArbitrary<unknown>();
          const { instance } = fakeArbitrary<unknown[]>();
          const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
          ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

          // Act
          const arb = withConfiguredGlobal(config, () =>
            array(childInstance, { minLength, maxLength, depthIdentifier })
          );

          // Assert
          expect(ArrayArbitrary).toHaveBeenCalledWith(
            childInstance,
            minLength,
            expect.any(Number),
            maxLength,
            depthIdentifier
          );
          const receivedGeneratedMaxLength = ArrayArbitrary.mock.calls[0][2]; // Expecting the real value would check an implementation detail
          expect(receivedGeneratedMaxLength).toBeGreaterThanOrEqual(minLength);
          expect(receivedGeneratedMaxLength).toBeLessThanOrEqual(maxLength);
          expect(Number.isInteger(receivedGeneratedMaxLength)).toBe(true);
          if (config.defaultSizeToMaxWhenMaxSpecified) {
            expect(ArrayArbitrary).toHaveBeenCalledWith(
              childInstance,
              minLength,
              maxLength,
              maxLength,
              depthIdentifier
            );
          }
          expect(arb).toBe(instance);
        }
      )
    );
  });

  it('should throw when minimum length is greater than maximum one', () => {
    fc.assert(
      fc.property(
        sizeRelatedGlobalConfigArb,
        fc.nat({ max: 2 ** 31 - 1 }),
        fc.nat({ max: 2 ** 31 - 1 }),
        (config, aLength, bLength) => {
          // Arrange
          fc.pre(aLength !== bLength);
          const [minLength, maxLength] = aLength < bLength ? [bLength, aLength] : [aLength, bLength];
          const { instance: childInstance } = fakeArbitrary<unknown>();

          // Act / Assert
          expect(() =>
            withConfiguredGlobal(config, () => array(childInstance, { minLength, maxLength }))
          ).toThrowError();
        }
      )
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
    const value = new Value(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});
