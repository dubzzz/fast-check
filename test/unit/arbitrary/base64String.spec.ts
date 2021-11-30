import * as fc from '../../../lib/fast-check';
import { base64String } from '../../../src/arbitrary/base64String';

import {
  assertProduceValuesShrinkableWithoutContext,
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/NextArbitraryAssertions';

import * as ArrayMock from '../../../src/arbitrary/array';
import { fakeNextArbitrary } from './__test-helpers__/NextArbitraryHelpers';
import { Value } from '../../../src/check/arbitrary/definition/Value';
import { buildNextShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('base64String', () => {
  it('should accept any constraints accepting at least one length multiple of 4', () =>
    fc.assert(
      fc.property(
        fc.nat({ max: 5 }),
        fc.integer({ min: 3, max: 30 }),
        fc.boolean(),
        fc.boolean(),
        (min, gap, withMin, withMax) => {
          // Arrange
          const constraints = { minLength: withMin ? min : undefined, maxLength: withMax ? min + gap : undefined };

          // Act / Assert
          expect(() => base64String(constraints)).not.toThrowError();
        }
      )
    ));

  it('should reject any constraints not accepting at least one length multiple of 4', () =>
    fc.assert(
      fc.property(fc.nat({ max: 30 }), fc.nat({ max: 2 }), (min, gap) => {
        // Arrange
        const constraints = { minLength: min, maxLength: min + gap };
        let includesMultipleOf4 = false;
        for (let acceptedLength = constraints.minLength; acceptedLength <= constraints.maxLength; ++acceptedLength) {
          includesMultipleOf4 = includesMultipleOf4 || acceptedLength % 4 === 0;
        }
        fc.pre(!includesMultipleOf4);

        // Act / Assert
        expect(() => base64String(constraints)).toThrowError();
      })
    ));

  it('should always query for arrays that will produce length fitting the requested range', () =>
    fc.assert(
      fc.property(
        fc.nat({ max: 30 }),
        fc.integer({ min: 3, max: 30 }),
        fc.boolean(),
        fc.boolean(),
        (min, gap, withMin, withMax) => {
          // Arrange
          const constraints = { minLength: withMin ? min : undefined, maxLength: withMax ? min + gap : undefined };
          const array = jest.spyOn(ArrayMock, 'array');
          const { instance: arrayInstance, map } = fakeNextArbitrary();
          array.mockReturnValue(arrayInstance);
          map.mockReturnValue(arrayInstance); // fake map

          // Act
          base64String(constraints);

          // Assert
          expect(array).toHaveBeenCalledTimes(1);
          const constraintsOnArray = array.mock.calls[0][1]!;
          const rounded4 = (value: number) => {
            switch (value % 4) {
              case 0:
                return value;
              case 1:
                return value;
              case 2:
                return value + 2;
              case 3:
                return value + 1;
            }
          };
          if (constraints.minLength !== undefined) {
            expect(constraintsOnArray.minLength).toBeDefined();
            expect(rounded4(constraintsOnArray.minLength!)).toBeGreaterThanOrEqual(constraints.minLength);
          }
          if (constraints.maxLength !== undefined) {
            expect(constraintsOnArray.maxLength).toBeDefined();
            expect(rounded4(constraintsOnArray.maxLength!)).toBeLessThanOrEqual(constraints.maxLength);
          }
          if (constraintsOnArray.minLength !== undefined && constraintsOnArray.maxLength !== undefined) {
            expect(constraintsOnArray.maxLength).toBeGreaterThanOrEqual(constraintsOnArray.minLength);
          }
        }
      )
    ));
});

describe('base64String (integration)', () => {
  type Extra = { minLength?: number; maxLength?: number };
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(fc.nat({ max: 30 }), fc.integer({ min: 3, max: 30 }), fc.boolean(), fc.boolean())
    .map(([min, gap, withMin, withMax]) => ({
      minLength: withMin ? min : undefined,
      // Minimal gap=3 to ensure we have at least one possible multiple of 4 between min and max
      maxLength: withMax ? min + gap : undefined,
    }));

  const isCorrect = (value: string, extra: Extra) => {
    if (extra.minLength !== undefined) {
      expect(value.length).toBeGreaterThanOrEqual(extra.minLength);
    }
    if (extra.maxLength !== undefined) {
      expect(value.length).toBeLessThanOrEqual(extra.maxLength);
    }
    const padStart = value.indexOf('=');
    const beforeEqualValue = value.substr(0, padStart === -1 ? value.length : padStart);
    const afterEqualValue = value.substr(padStart === -1 ? value.length : padStart);
    for (const c of beforeEqualValue.split('')) {
      expect('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/'.split('')).toContainEqual(c);
    }
    expect(['', '=', '==']).toContainEqual(afterEqualValue);
  };

  const base64StringBuilder = (extra: Extra) => base64String(extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(base64StringBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(base64StringBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(base64StringBuilder, { extraParameters });
  });

  // assertShrinkProducesSameValueWithoutInitialContext is not applicable for base64String has some values will not shrink exactly the same way.
  // For instance: 'abcde' will be mapped to 'abcd', with default shrink it will try to shrink from 'abcde'. With context-less one it will start from 'abcd'.

  it.each`
    rawValue
    ${'ABCD'}
    ${'0123AB=='}
  `('should be able to shrink $rawValue', ({ rawValue }) => {
    // Arrange
    const arb = base64String();
    const value = new Value(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});
