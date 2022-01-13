import * as fc from '../../../lib/fast-check';
import { set } from '../../../src/arbitrary/set';

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

describe('set', () => {
  it('should instantiate ArrayArbitrary(arb, 0, ?, ?, <default>) for set(arb)', () => {
    // Arrange
    const { instance: childInstance } = fakeNextArbitrary<unknown>();
    const { instance } = fakeNextArbitrary<unknown[]>();
    const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
    ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

    // Act
    const arb = set(convertFromNext(childInstance));

    // Assert
    expect(ArrayArbitrary).toHaveBeenCalledWith(
      childInstance,
      0,
      expect.any(Number),
      expect.any(Number),
      expect.any(Function)
    );
    const receivedGeneratedMaxLength = ArrayArbitrary.mock.calls[0][2]; // Expecting the real value would check an implementation detail
    expect(receivedGeneratedMaxLength).toBeGreaterThan(0);
    expect(receivedGeneratedMaxLength).toBeLessThanOrEqual(2 ** 31 - 1);
    expect(Number.isInteger(receivedGeneratedMaxLength)).toBe(true);
    const receivedMaxLength = ArrayArbitrary.mock.calls[0][3]; // Starting at v3, maxLength will be 0x7fffffff in such case
    expect(receivedMaxLength).toBe(receivedGeneratedMaxLength);
    expect(convertToNext(arb)).toBe(instance);
  });

  it('should instantiate ArrayArbitrary(arb, 0, maxLength, maxLength, <default>) for array(set, {maxLength})', () => {
    fc.assert(
      fc.property(fc.nat({ max: 2 ** 31 - 1 }), (maxLength) => {
        // Arrange
        const { instance: childInstance } = fakeNextArbitrary<unknown>();
        const { instance } = fakeNextArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

        // Act
        const arb = set(convertFromNext(childInstance), { maxLength });

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(childInstance, 0, maxLength, maxLength, expect.any(Function));
        expect(convertToNext(arb)).toBe(instance);
      })
    );
  });

  it('should instantiate ArrayArbitrary(arb, minLength, ?, ? <default>) for set(arb, {minLength})', () => {
    fc.assert(
      fc.property(fc.nat({ max: 2 ** 31 - 1 }), (minLength) => {
        // Arrange
        const { instance: childInstance } = fakeNextArbitrary<unknown>();
        const { instance, filter } = fakeNextArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);
        filter.mockReturnValue(instance);

        // Act
        const arb = set(convertFromNext(childInstance), { minLength });

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(
          childInstance,
          minLength,
          expect.any(Number),
          expect.any(Number),
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
        const receivedMaxLength = ArrayArbitrary.mock.calls[0][3]; // Starting at v3, maxLength will be 0x7fffffff in such case
        expect(receivedMaxLength).toBe(receivedGeneratedMaxLength);
        expect(convertToNext(arb)).toBe(instance);
      })
    );
  });

  it('should instantiate ArrayArbitrary(arb, minLength, maxLength, maxLength, <default>) for set(arb, {minLength,maxLength})', () => {
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
        const arb = set(convertFromNext(childInstance), { minLength, maxLength });

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

  it('should pass the compare operator down to the instantiated ArrayArbitrary', () => {
    fc.assert(
      fc.property(
        fc
          .record(
            {
              minLength: fc.nat({ max: 2 ** 31 - 1 }),
              maxLength: fc.nat({ max: 2 ** 31 - 1 }),
              compare: equalityCompare(),
            },
            { requiredKeys: ['compare'] }
          )
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
          const arb = set(convertFromNext(childInstance), { ...constraints });

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

  it('[legacy] should instantiate ArrayArbitrary(arb, 0, ?, ?, compare) for set(arb, compare)', () => {
    fc.assert(
      fc.property(equalityCompare(), (compare) => {
        // Arrange
        const { instance: childInstance } = fakeNextArbitrary<unknown>();
        const { instance } = fakeNextArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

        // Act
        const arb = set(convertFromNext(childInstance), compare);

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(
          childInstance,
          0,
          expect.any(Number),
          expect.any(Number),
          expect.any(Function)
        );
        const receivedGeneratedMaxLength = ArrayArbitrary.mock.calls[0][2]; // Expecting the real value would check an implementation detail
        expect(receivedGeneratedMaxLength).toBeGreaterThan(0);
        expect(receivedGeneratedMaxLength).toBeLessThanOrEqual(2 ** 31 - 1);
        expect(Number.isInteger(receivedGeneratedMaxLength)).toBe(true);
        const receivedMaxLength = ArrayArbitrary.mock.calls[0][3]; // Starting at v3, maxLength will be 0x7fffffff in such case
        expect(receivedMaxLength).toBe(receivedGeneratedMaxLength);
        expect(convertToNext(arb)).toBe(instance);
      })
    );
  });

  it('[legacy] should instantiate ArrayArbitrary(arb, 0, maxLength, <default>) for set(arb, maxLength)', () => {
    fc.assert(
      fc.property(fc.nat({ max: 2 ** 31 - 1 }), (maxLength) => {
        // Arrange
        const { instance: childInstance } = fakeNextArbitrary<unknown>();
        const { instance } = fakeNextArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

        // Act
        const arb = set(convertFromNext(childInstance), maxLength);

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(childInstance, 0, maxLength, maxLength, expect.any(Function));
        expect(convertToNext(arb)).toBe(instance);
      })
    );
  });

  it('[legacy] should instantiate ArrayArbitrary(arb, 0, maxLength, maxLength, compare) for set(arb, maxLength, compare)', () => {
    fc.assert(
      fc.property(fc.nat({ max: 2 ** 31 - 1 }), equalityCompare(), (maxLength, compare) => {
        // Arrange
        const { instance: childInstance } = fakeNextArbitrary<unknown>();
        const { instance } = fakeNextArbitrary<unknown[]>();
        const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
        ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);

        // Act
        const arb = set(convertFromNext(childInstance), maxLength, compare);

        // Assert
        expect(ArrayArbitrary).toHaveBeenCalledWith(childInstance, 0, maxLength, maxLength, expect.any(Function));
        expect(convertToNext(arb)).toBe(instance);
      })
    );
  });

  it('[legacy] should instantiate ArrayArbitrary(arb, minLength, maxLength, maxLength, <default>) for set(arb, minLength, maxLength)', () => {
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
        const arb = set(convertFromNext(childInstance), minLength, maxLength);

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

  it('[legacy] should instantiate ArrayArbitrary(arb, minLength, maxLength, maxLength, compare) for set(arb, minLength, maxLength, compare)', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 2 ** 31 - 1 }),
        fc.nat({ max: 2 ** 31 - 1 }),
        equalityCompare(),
        (aLength, bLength, compare) => {
          // Arrange
          const [minLength, maxLength] = aLength < bLength ? [aLength, bLength] : [bLength, aLength];
          const { instance: childInstance } = fakeNextArbitrary<unknown>();
          const { instance, filter } = fakeNextArbitrary<unknown[]>();
          const ArrayArbitrary = jest.spyOn(ArrayArbitraryMock, 'ArrayArbitrary');
          ArrayArbitrary.mockImplementation(() => instance as ArrayArbitraryMock.ArrayArbitrary<unknown>);
          filter.mockReturnValue(instance);

          // Act
          const arb = set(convertFromNext(childInstance), minLength, maxLength, compare);

          // Assert
          expect(ArrayArbitrary).toHaveBeenCalledWith(
            childInstance,
            minLength,
            maxLength,
            maxLength,
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
        fc.option(equalityCompare(), { nil: undefined }),
        (aLength, bLength, compare) => {
          // Arrange
          fc.pre(aLength !== bLength);
          const [minLength, maxLength] = aLength < bLength ? [bLength, aLength] : [aLength, bLength];
          const { instance: childInstance } = fakeNextArbitrary<unknown>();

          // Act / Assert
          expect(() => set(convertFromNext(childInstance), { minLength, maxLength, compare })).toThrowError();
        }
      )
    );
  });
});

describe('set (integration)', () => {
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
    expect([...new Set(value)]).toEqual(value);
  };

  const setBuilder = (extra: Extra) => convertToNext(set(convertFromNext(new FakeIntegerArbitrary()), extra));

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(setBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(setBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(setBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(setBuilder, { extraParameters });
  });

  // Property: should preserve strictly smaller ordering in shrink
  // Is not applicable in the case of `set` as some values may not be in the "before" version
  // of the array while they can suddenly appear on shrink. They might have been hidden because
  // another value inside the array shadowed them. While on shrink those entries shadowing others
  // may have disappear.

  it.each`
    rawValue                 | minLength
    ${[2, 4, 8, 16, 32, 64]} | ${undefined}
    ${[2, 4, 8]}             | ${undefined}
    ${[2, 4, 8]}             | ${2}
    ${[2, 4, 8]}             | ${3}
  `('should be able to shrink $rawValue given constraints minLength:$minLength', ({ rawValue, minLength }) => {
    // Arrange
    const constraints = { minLength };
    const arb = convertToNext(set(convertFromNext(new FakeIntegerArbitrary(0, 1000)), constraints));
    const value = new NextValue(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});

// Helpers

function equalityCompare() {
  return fc.compareFunc().map((f) => {
    return (a: unknown, b: unknown) => f(a, b) === 0;
  });
}
