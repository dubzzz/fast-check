import * as fc from '../../../lib/fast-check';
import { uniqueArray, UniqueArrayConstraints } from '../../../src/arbitrary/uniqueArray';

import { convertFromNext, convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { FakeIntegerArbitrary, fakeNextArbitrary } from './__test-helpers__/NextArbitraryHelpers';

import * as ArrayArbitraryMock from '../../../src/arbitrary/_internals/ArrayArbitrary';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/NextArbitraryAssertions';
import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';
import { buildNextShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('uniqueArray', () => {
  it('should instantiate ArrayArbitrary(arb, 0, ?, 0x7fffffff, <default>) for uniqueArray(arb)', () => {
    // Arrange
    const { instance: childInstance } = fakeNextArbitrary<unknown>();
    const { instance } = fakeNextArbitrary<unknown[]>();
    const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
    ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

    // Act
    const arb = uniqueArray(convertFromNext(childInstance));

    // Assert
    expect(ArrayArbitrary).toHaveBeenCalledWith(childInstance, 0, expect.any(Number), 0x7fffffff, expect.any(Function));
    const receivedGeneratedMaxLength = ArrayArbitrary.mock.calls[0][2]; // Expecting the real value would check an implementation detail
    expect(receivedGeneratedMaxLength).toBeGreaterThan(0);
    expect(receivedGeneratedMaxLength).toBeLessThanOrEqual(2 ** 31 - 1);
    expect(Number.isInteger(receivedGeneratedMaxLength)).toBe(true);
    expect(convertToNext(arb)).toBe(instance);
  });

  it('should instantiate ArrayArbitrary(arb, 0, maxLength, maxLength, <default>) for uniqueArray(set, {maxLength})', () => {
    fc.assert(
      fc.property(fc.nat({ max: 2 ** 31 - 1 }), (maxLength) => {
        // Arrange
        const { instance: childInstance } = fakeNextArbitrary<unknown>();
        const { instance } = fakeNextArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

        // Act
        const arb = uniqueArray(convertFromNext(childInstance), { maxLength });

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(childInstance, 0, maxLength, maxLength, expect.any(Function));
        expect(convertToNext(arb)).toBe(instance);
      })
    );
  });

  it('should instantiate ArrayArbitrary(arb, minLength, ?, 0x7fffffff <default>) for uniqueArray(arb, {minLength})', () => {
    fc.assert(
      fc.property(fc.nat({ max: 2 ** 31 - 1 }), (minLength) => {
        // Arrange
        const { instance: childInstance } = fakeNextArbitrary<unknown>();
        const { instance, filter } = fakeNextArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);
        filter.mockReturnValue(instance);

        // Act
        const arb = uniqueArray(convertFromNext(childInstance), { minLength });

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(
          childInstance,
          minLength,
          expect.any(Number),
          0x7fffffff,
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
        expect(convertToNext(arb)).toBe(instance);
      })
    );
  });

  it('should instantiate ArrayArbitrary(arb, minLength, maxLength, maxLength, <default>) for uniqueArray(arb, {minLength,maxLength})', () => {
    fc.assert(
      fc.property(fc.nat({ max: 2 ** 31 - 1 }), fc.nat({ max: 2 ** 31 - 1 }), (aLength, bLength) => {
        // Arrange
        const [minLength, maxLength] = aLength < bLength ? [aLength, bLength] : [bLength, aLength];
        const { instance: childInstance } = fakeNextArbitrary<unknown>();
        const { instance, filter } = fakeNextArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);
        filter.mockReturnValue(instance);

        // Act
        const arb = uniqueArray(convertFromNext(childInstance), { minLength, maxLength });

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(
          childInstance,
          minLength,
          maxLength,
          maxLength,
          expect.any(Function)
        );
        expect(convertToNext(arb)).toBe(instance);
      })
    );
  });

  it('should accept custom comparator or selector or both at the same time or none', () => {
    fc.assert(
      fc.property(
        fc
          .record({
            minLength: fc.nat({ max: 2 ** 31 - 1 }),
            maxLength: fc.nat({ max: 2 ** 31 - 1 }),
            comparator: comparatorArbitrary(),
            selector: selectorArbitrary(),
          })
          .map((constraints) =>
            constraints.minLength !== undefined &&
            constraints.maxLength !== undefined &&
            constraints.minLength > constraints.maxLength
              ? { ...constraints, minLength: constraints.maxLength, maxLength: constraints.minLength }
              : { ...constraints }
          ),
        (constraints) => {
          // Arrange
          const { instance: childInstance } = fakeNextArbitrary<unknown>();
          const { instance, filter } = fakeNextArbitrary<unknown[]>();
          const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
          ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);
          filter.mockReturnValue(instance);

          // Act
          const arb = uniqueArray(convertFromNext(childInstance), { ...constraints });

          // Assert
          expect(ArrayArbitrary).toHaveBeenCalledWith(
            childInstance,
            constraints.minLength !== undefined ? constraints.minLength : expect.any(Number),
            constraints.maxLength !== undefined ? constraints.maxLength : expect.any(Number),
            constraints.maxLength !== undefined ? constraints.maxLength : expect.any(Number),
            expect.any(Function)
          );
          expect(convertToNext(arb)).toBe(instance);
        }
      )
    );
  });

  it('should throw when minimum length is greater than maximum one', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 2 ** 31 - 1 }),
        fc.nat({ max: 2 ** 31 - 1 }),
        fc.option(comparatorArbitrary(), { nil: undefined }),
        fc.option(selectorArbitrary(), { nil: undefined }),
        (aLength, bLength, comparator, selector) => {
          // Arrange
          fc.pre(aLength !== bLength);
          const [minLength, maxLength] = aLength < bLength ? [bLength, aLength] : [aLength, bLength];
          const { instance: childInstance } = fakeNextArbitrary<unknown>();

          // Act / Assert
          expect(() =>
            uniqueArray(convertFromNext(childInstance), { minLength, maxLength, comparator, selector })
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
    .map(([min, gap, withMin, withMax, selector, comparator]) => ({
      minLength: withMin ? min : undefined,
      maxLength: withMax ? min + gap : undefined,
      // We only apply selector/comparator in case the minimal number of items requested
      // is lower or equal to 1. Above this value there are chances that we will never be
      // able to fulfill the constraints because of selector or comparator (eg.: making
      // all the value equal together).
      selector: withMin && min > 1 ? undefined : selector,
      comparator: withMin && min > 1 ? undefined : comparator,
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
    if (extra.selector !== undefined || extra.comparator !== undefined) {
      const selector = extra.selector || ((a) => a);
      const comparator =
        typeof extra.comparator === 'function' ? extra.comparator : (a: unknown, b: unknown) => a === b;
      const alreadySeen: unknown[] = [];
      for (const v of value) {
        const selected = selector(v);
        const matchingEntry = alreadySeen.some((e) => comparator(e, selected));
        expect(matchingEntry).toBe(false);
        alreadySeen.push(selected);
      }
    } else {
      expect([...new Set(value)]).toEqual(value);
    }
  };

  const uniqueArrayBuilder = (extra: Extra) =>
    convertToNext(uniqueArray(convertFromNext(new FakeIntegerArbitrary(0, 10000)), extra));

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
    const arb = convertToNext(uniqueArray(convertFromNext(new FakeIntegerArbitrary(0, 1000)), constraints));
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
    const arb = convertToNext(uniqueArray(convertFromNext(new FakeIntegerArbitrary(0, 1000)), constraints));
    const value = new NextValue(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});

// Helpers

type ComparatorType = UniqueArrayConstraints<unknown, unknown>['comparator'];

function comparatorArbitrary(): fc.Arbitrary<ComparatorType> {
  return fc.oneof(
    fc.constantFrom<ComparatorType>('IsStrictlyEqual', 'SameValue', 'SameValueZero'),
    fc.compareFunc().map((f) => (a: unknown, b: unknown) => f(a, b) === 0)
  );
}

type SelectorType = UniqueArrayConstraints<unknown, unknown>['selector'];

function selectorArbitrary(): fc.Arbitrary<SelectorType> {
  return fc.func(fc.anything());
}
