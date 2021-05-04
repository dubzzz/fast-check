import * as fc from '../../../lib/fast-check';
import { base64String } from '../../../src/arbitrary/base64String';

import { convertFromNext, convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import {
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesCorrectValues,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesCorrectValues,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
} from '../check/arbitrary/generic/NextArbitraryAssertions';

import * as ArrayMock from '../../../src/arbitrary/array';
import { fakeNextArbitrary } from '../check/arbitrary/generic/NextArbitraryHelpers';
import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';
import { buildNextShrinkTree, renderTree } from '../check/arbitrary/generic/ShrinkTree';

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
        fc.nat({ max: 30 }),
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
          array.mockReturnValue(convertFromNext(arrayInstance));
          map.mockReturnValue(arrayInstance); // fake map

          // Act
          base64String(constraints);

          // Assert
          expect(array).toHaveBeenCalledTimes(1);
          const constraintsOnArray = array.mock.calls[0][1];
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

  const base64StringBuilder = (extra: Extra) => convertToNext(base64String(extra));

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(base64StringBuilder, { extraParameters });
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(base64StringBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(base64StringBuilder, { extraParameters });
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(base64StringBuilder, { extraParameters });
  });

  // assertShrinkProducesSameValueWithoutInitialContext is not applicable for base64String has some values will not shrink exactly the same way.
  // For instance: 'abcde' will be mapped to 'abcd', with default shrink it will try to shrink from 'abcde'. With context-less one it will start from 'abcd'.

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(base64StringBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(base64StringBuilder, { extraParameters });
  });

  it('should be able to shrink any valid string (given right length and charset)', () => {
    // Arrange
    const arb = convertToNext(base64String());
    const value = new NextValue('0123AB==');

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 50 })).join('\n');

    // Assert
    expect(renderedTree).toMatchInlineSnapshot(`
      "\\"0123AB==\\"
      ├> \\"\\"
      ├> \\"3AB=\\"
      |  ├> \\"AB==\\"
      |  |  ├> \\"\\"
      |  |  |  ├> \\"\\"
      |  |  |  └> \\"\\"
      |  |  |     └> \\"\\"
      |  |  ├> \\"\\"
      |  |  |  └> \\"\\"
      |  |  └> \\"AA==\\"
      |  |     ├> \\"\\"
      |  |     |  └> \\"\\"
      |  |     └> \\"\\"
      |  |        └> \\"\\"
      |  ├> \\"AAB=\\"
      |  |  ├> \\"AB==\\"
      |  |  |  ├> \\"\\"
      |  |  |  |  ├> \\"\\"
      |  |  |  |  └> \\"\\"
      |  |  |  |     └> \\"\\"
      |  |  |  ├> \\"\\"
      |  |  |  |  └> \\"\\"
      |  |  |  └> \\"AA==\\"
      |  |  |     ├> \\"\\"
      |  |  |     |  └> \\"\\"
      |  |  |     └> \\"\\"
      |  |  |        └> \\"\\"
      |  |  ├> \\"\\"
      |  |  |  └> \\"\\"
      |  |  ├> \\"AB==\\"
      |  |  |  ├> \\"\\"
      |  |  |  |  ├> \\"\\"
      |  |  |  |  └> \\"\\"
      |  |  |  |     └> \\"\\"
      |  |  |  ├> \\"\\"
      |  |  |  |  └> \\"\\"
      |  |  |  └> \\"AA==\\"
      |  |  |     ├> \\"\\"
      |  |  |     |  └> \\"\\"
      |  |  |     └> \\"\\"
      |  |  |        └> \\"\\"
      |  |  ├> \\"AA==\\"
      |  |  |  ├> \\"\\"
      |  |  |  |  └> \\"\\"
      |  |  |  └> \\"\\"
      |  |  |     └> \\"\\"
      |  |  └> \\"AAA=\\"
      |  |     ├> \\"AA==\\"
      |  |     |  ├> \\"\\"
      |  |     |  |  └> …
      |  |     |  └> …
      |  |     └> …
      |  └> …
      └> …"
    `);
  });
});
