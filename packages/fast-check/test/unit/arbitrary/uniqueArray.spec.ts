import * as fc from 'fast-check';
import { uniqueArray, UniqueArrayConstraints } from '../../../src/arbitrary/uniqueArray';

import { FakeIntegerArbitrary, fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';

import * as ArrayArbitraryMock from '../../../src/arbitrary/_internals/ArrayArbitrary';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions';
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

describe('uniqueArray', () => {
  it('should instantiate ArrayArbitrary(arb, 0, ?, 0x7fffffff, n.a, <default>) for uniqueArray(arb)', () => {
    fc.assert(
      fc.property(sizeRelatedGlobalConfigArb, (config) => {
        // Arrange
        const { instance: childInstance } = fakeArbitrary<unknown>();
        const { instance } = fakeArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

        // Act
        const arb = withConfiguredGlobal(config, () => uniqueArray(childInstance));

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(
          childInstance,
          0,
          expect.any(Number),
          0x7fffffff,
          undefined,
          expect.any(Function)
        );
        const receivedGeneratedMaxLength = ArrayArbitrary.mock.calls[0][2]; // Expecting the real value would check an implementation detail
        expect(receivedGeneratedMaxLength).toBeGreaterThan(0);
        expect(receivedGeneratedMaxLength).toBeLessThanOrEqual(2 ** 31 - 1);
        expect(Number.isInteger(receivedGeneratedMaxLength)).toBe(true);
        expect(arb).toBe(instance);
      })
    );
  });

  it('should instantiate ArrayArbitrary(arb, 0, ?, maxLength, n.a, <default>) for uniqueArray(set, {maxLength})', () => {
    fc.assert(
      fc.property(sizeRelatedGlobalConfigArb, fc.nat({ max: 2 ** 31 - 1 }), (config, maxLength) => {
        // Arrange
        const { instance: childInstance } = fakeArbitrary<unknown>();
        const { instance } = fakeArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

        // Act
        const arb = withConfiguredGlobal(config, () => uniqueArray(childInstance, { maxLength }));

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(
          childInstance,
          0,
          expect.any(Number),
          maxLength,
          undefined,
          expect.any(Function)
        );
        const receivedGeneratedMaxLength = ArrayArbitrary.mock.calls[0][2]; // Expecting the real value would check an implementation detail
        expect(receivedGeneratedMaxLength).toBeGreaterThanOrEqual(0);
        expect(receivedGeneratedMaxLength).toBeLessThanOrEqual(maxLength);
        expect(Number.isInteger(receivedGeneratedMaxLength)).toBe(true);
        if (config.defaultSizeToMaxWhenMaxSpecified) {
          expect(ArrayArbitrary).toHaveBeenCalledWith(
            childInstance,
            0,
            maxLength,
            maxLength,
            undefined,
            expect.any(Function)
          );
        }
        expect(arb).toBe(instance);
      })
    );
  });

  it('should instantiate ArrayArbitrary(arb, minLength, ?, 0x7fffffff, n.a, <default>) for uniqueArray(arb, {minLength})', () => {
    fc.assert(
      fc.property(sizeRelatedGlobalConfigArb, fc.nat({ max: 2 ** 31 - 1 }), (config, minLength) => {
        // Arrange
        const { instance: childInstance } = fakeArbitrary<unknown>();
        const { instance, filter } = fakeArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);
        filter.mockReturnValue(instance);

        // Act
        const arb = withConfiguredGlobal(config, () => uniqueArray(childInstance, { minLength }));

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(
          childInstance,
          minLength,
          expect.any(Number),
          0x7fffffff,
          undefined,
          expect.any(Function)
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

  it('should instantiate ArrayArbitrary(arb, minLength, ?, maxLength, n.a, <default>) for uniqueArray(arb, {minLength,maxLength})', () => {
    fc.assert(
      fc.property(
        sizeRelatedGlobalConfigArb,
        fc.nat({ max: 2 ** 31 - 1 }),
        fc.nat({ max: 2 ** 31 - 1 }),
        (config, aLength, bLength) => {
          // Arrange
          const [minLength, maxLength] = aLength < bLength ? [aLength, bLength] : [bLength, aLength];
          const { instance: childInstance } = fakeArbitrary<unknown>();
          const { instance, filter } = fakeArbitrary<unknown[]>();
          const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
          ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);
          filter.mockReturnValue(instance);

          // Act
          const arb = withConfiguredGlobal(config, () => uniqueArray(childInstance, { minLength, maxLength }));

          // Assert
          expect(ArrayArbitrary).toHaveBeenCalledWith(
            childInstance,
            minLength,
            expect.any(Number),
            maxLength,
            undefined,
            expect.any(Function)
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
              undefined,
              expect.any(Function)
            );
          }
          expect(arb).toBe(instance);
        }
      )
    );
  });

  it('should accept custom comparator or selector or both at the same time or none', () => {
    fc.assert(
      fc.property(
        sizeRelatedGlobalConfigArb,
        fc
          .record(
            {
              minLength: fc.nat({ max: 2 ** 31 - 1 }),
              maxLength: fc.nat({ max: 2 ** 31 - 1 }),
              comparator: comparatorArbitrary(),
              selector: selectorArbitrary(),
              depthIdentifier: fc.string(),
            },
            { requiredKeys: [] }
          )
          .map((constraints) =>
            constraints.minLength !== undefined &&
            constraints.maxLength !== undefined &&
            constraints.minLength > constraints.maxLength
              ? ({
                  ...constraints,
                  minLength: constraints.maxLength,
                  maxLength: constraints.minLength,
                } as UniqueArrayConstraints<unknown, unknown>)
              : ({ ...constraints } as UniqueArrayConstraints<unknown, unknown>)
          ),
        (config, constraints) => {
          // Arrange
          const { instance: childInstance } = fakeArbitrary<unknown>();
          const { instance, filter } = fakeArbitrary<unknown[]>();
          const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
          ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);
          filter.mockReturnValue(instance);

          // Act
          const arb = withConfiguredGlobal(config, () => uniqueArray(childInstance, constraints));

          // Assert
          expect(ArrayArbitrary).toHaveBeenCalledWith(
            childInstance,
            constraints.minLength !== undefined ? constraints.minLength : expect.any(Number),
            expect.any(Number),
            constraints.maxLength !== undefined ? constraints.maxLength : expect.any(Number),
            constraints.depthIdentifier,
            expect.any(Function)
          );
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
        fc.option(comparatorArbitrary(), { nil: undefined }),
        fc.option(selectorArbitrary(), { nil: undefined }),
        (config, aLength, bLength, comparator, selector) => {
          // Arrange
          fc.pre(aLength !== bLength);
          const [minLength, maxLength] = aLength < bLength ? [bLength, aLength] : [aLength, bLength];
          const { instance: childInstance } = fakeArbitrary<unknown>();

          // Act / Assert
          expect(() =>
            withConfiguredGlobal(config, () =>
              uniqueArray(childInstance, { minLength, maxLength, comparator, selector })
            )
          ).toThrowError();
        }
      )
    );
  });
});

describe('uniqueArray (integration)', () => {
  type Extra = UniqueArrayConstraints<unknown, unknown>;
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(
      fc.nat({ max: 5 }),
      fc.nat({ max: 30 }),
      fc.boolean(),
      fc.boolean(),
      fc.option(fc.func(fc.integer()), { nil: undefined }),
      fc.option(comparatorArbitrary(), { nil: undefined })
    )
    .map(([min, gap, withMin, withMax, selector, comparator]) => {
      // We only apply selector/comparator in case the minimal number of items requested can be reached with the selector/comparator.
      // eg.: selector = v => 0, means that we will have at most 1 value in the array, never more, so it cannot be used with min > 1
      const requestedMin = withMin ? min : 0;
      let selectorEnabled = requestedMin === 0 || selector === undefined;
      let comparatorEnabled = requestedMin === 0 || comparator === undefined;
      const sampleSize = 50;
      const sampledSelectedValues = new Set<unknown>();
      const sampledSelectedAndComparedValues: unknown[] = [];
      const resolvedSelector = resolveSelectorFunction(selector);
      const resolvedComparator = resolveComparatorFunction(comparator);
      for (let v = 0; v !== sampleSize && (!selectorEnabled || !comparatorEnabled); ++v) {
        const selected = resolvedSelector(v); // either v (integer in 0..sampleSize) or an integer (by construct of selector)
        sampledSelectedValues.add(selected);
        selectorEnabled = selectorEnabled || sampledSelectedValues.size >= requestedMin;
        if (!comparatorEnabled && comparator !== undefined) {
          if (sampledSelectedAndComparedValues.every((p) => !resolvedComparator(p, selected))) {
            // Selected is "different" from all the other known values
            sampledSelectedAndComparedValues.push(selected);
            comparatorEnabled = comparatorEnabled || sampledSelectedAndComparedValues.length >= requestedMin;
            selectorEnabled = selectorEnabled || comparatorEnabled; // comparator enabled unlocks selector too
          }
        }
      }
      return {
        minLength: withMin ? min : undefined,
        maxLength: withMax ? min + gap : undefined,
        selector: selectorEnabled ? selector : undefined,
        comparator: comparatorEnabled ? comparator : undefined,
      };
    });

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
    const resolvedSelector = resolveSelectorFunction(extra.selector);
    const resolvedComparator = resolveComparatorFunction(extra.comparator);
    const alreadySeen: unknown[] = [];
    for (const v of value) {
      const selected = resolvedSelector(v);
      const matchingEntry = alreadySeen.some((e) => resolvedComparator(e, selected));
      expect(matchingEntry).toBe(false);
      alreadySeen.push(selected);
    }
  };

  const integerUpTo10000AndNaNOrMinusZero = new FakeIntegerArbitrary(-2, 10000).map(
    (v) => (v === -2 ? Number.NaN : v === -1 ? -0 : v),
    (v) => {
      if (typeof v !== 'number' || v === -1 || v === -2) throw new Error('');
      return Object.is(v, Number.NaN) ? -2 : Object.is(v, -0) ? -1 : v;
    }
  );
  const uniqueArrayBuilder = (extra: Extra) => uniqueArray(integerUpTo10000AndNaNOrMinusZero, extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(uniqueArrayBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(uniqueArrayBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(uniqueArrayBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(uniqueArrayBuilder, { extraParameters });
  });

  // Property: should preserve strictly smaller ordering in shrink
  // Is not applicable in the case of `set` as some values may not be in the "before" version
  // of the array while they can suddenly appear on shrink. They might have been hidden because
  // another value inside the array shadowed them. While on shrink those entries shadowing others
  // may have disappear.

  it.each`
    source                                       | constraints
    ${[2, 4, 8] /* not large enough */}          | ${{ minLength: 4 }}
    ${[2, 4, 8] /* too large */}                 | ${{ maxLength: 2 }}
    ${[2, 4, 8] /* not unique for selector */}   | ${{ selector: (item: number) => Math.floor(item / 5) }}
    ${[2, 4, 8] /* not unique for comparator */} | ${{ comparator: (a: number, b: number) => Math.abs(a - b) <= 2 }}
  `('should not be able to generate $source with fc.uniqueArray(arb, $constraints)', ({ source, constraints }) => {
    // Arrange / Act
    const arb = uniqueArray(new FakeIntegerArbitrary(0, 1000), constraints);
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(false);
  });

  it.each`
    rawValue                 | constraints
    ${[2, 4, 8, 16, 32, 64]} | ${{}}
    ${[2, 4, 8]}             | ${{}}
    ${[2, 4, 8]}             | ${{ minLength: 2 }}
    ${[2, 4, 8]}             | ${{ minLength: 3 }}
    ${[2, 8]}                | ${{ selector: (item: number) => Math.floor(item / 5) }}
    ${[2, 8]}                | ${{ comparator: (a: number, b: number) => Math.abs(a - b) <= 2 }}
  `('should be able to shrink $rawValue with fc.uniqueArray(arb, $constraints)', ({ rawValue, constraints }) => {
    // Arrange
    const arb = uniqueArray(new FakeIntegerArbitrary(0, 1000), constraints);
    const value = new Value(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});

// Helpers

type ComparatorType<T = unknown, U = unknown> = UniqueArrayConstraints<T, U>['comparator'];

function comparatorArbitrary(): fc.Arbitrary<ComparatorType> {
  return fc.oneof(
    fc.constantFrom<ComparatorType>('IsStrictlyEqual', 'SameValue', 'SameValueZero'),
    fc.compareFunc().map((f) => (a: unknown, b: unknown) => f(a, b) === 0)
  );
}

function resolveComparatorFunction<T, U>(
  comparator: ComparatorType<T, U> | undefined
): (a: unknown, b: unknown) => boolean {
  if (comparator === undefined) {
    return (a, b) => Object.is(a, b);
  }
  if (typeof comparator === 'function') {
    return comparator as (a: unknown, b: unknown) => boolean;
  }
  switch (comparator) {
    case 'IsStrictlyEqual':
      return (a, b) => a === b;
    case 'SameValue':
      return (a, b) => Object.is(a, b);
    case 'SameValueZero':
      return (a, b) => (a === 0 && b === 0) || Object.is(a, b);
  }
}

type SelectorType<T = unknown, U = unknown> = UniqueArrayConstraints<T, U>['selector'];

function selectorArbitrary(): fc.Arbitrary<SelectorType> {
  return fc.func(fc.anything());
}

function resolveSelectorFunction<T, U>(selector: SelectorType<T, U> | undefined): (a: unknown) => unknown {
  if (selector === undefined) {
    return (a) => a;
  }
  return selector as (a: unknown) => unknown;
}
