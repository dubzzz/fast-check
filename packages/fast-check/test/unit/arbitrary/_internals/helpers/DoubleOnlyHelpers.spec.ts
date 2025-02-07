import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { doubleToIndex, indexToDouble } from '../../../../../src/arbitrary/_internals/helpers/DoubleHelpers';
import {
  maxNonIntegerValue,
  onlyIntegersAfterThisValue,
  refineConstraintsForDoubleOnly,
} from '../../../../../src/arbitrary/_internals/helpers/DoubleOnlyHelpers';
import type { DoubleConstraints } from '../../../../../src/arbitrary/double';

describe('maxNonIntegerValue', () => {
  it('should be immediately followed by an integer', () => {
    // Arrange / Act
    const next = nextDouble(maxNonIntegerValue);

    // Assert
    expect(Number.isInteger(next)).toBe(true);
  });

  it('should be followed by a number immediatelly followed by an integer', () => {
    // Arrange / Act
    const next = nextDouble(maxNonIntegerValue);
    const nextNext = nextDouble(next);

    // Assert
    expect(Number.isInteger(nextNext)).toBe(true);
  });

  it('should be immediately followed by onlyIntegersAfterThisValue', () => {
    // Arrange / Act / Assert
    expect(nextDouble(maxNonIntegerValue)).toBe(onlyIntegersAfterThisValue);
  });
});

describe('refineConstraintsForDoubleOnly', () => {
  it.each`
    sourceRange                                   | targetRange
    ${'[-1;1]'}                                   | ${']-1;1[' /* -1 and 1 being integers we don't need them in the range */}
    ${']-1;1['}                                   | ${']-1;1['}
    ${'[-1;1['}                                   | ${']-1;1['}
    ${']-1;1]'}                                   | ${']-1;1['}
    ${'[-4503599627370496;4503599627370496]'}     | ${'[-4503599627370495.5;4503599627370495.5]' /* 4503599627370496 is the starting point for the world of integers / equivalent to ]-4503599627370496;4503599627370496[ */}
    ${']-4503599627370496;4503599627370496['}     | ${']-4503599627370496;4503599627370496['}
    ${'[-10000000000000000;10000000000000000]'}   | ${'[-4503599627370495.5;4503599627370495.5]' /* 10000000000000000 is outside of the area of non-integers / equivalent to ]-4503599627370496;4503599627370496[ */}
    ${']-10000000000000000;10000000000000000['}   | ${']-4503599627370496;4503599627370496['}
    ${'[-0;1]'}                                   | ${']0;1[' /* -0 is followed by an integer value, it needs to be skipped... */}
    ${']-0;1['}                                   | ${']0;1['}
    ${'[-1;-0]'}                                  | ${']-1;-0[' /* ...only if -0 is on the left side of the range */}
    ${']-1;-0['}                                  | ${']-1;-0['}
    ${'[-1;0]'}                                   | ${']-1;-0[' /* 0 is followed by an integer value, it needs to be skipped... */}
    ${']-1;0['}                                   | ${']-1;-0['}
    ${'[0;1]'}                                    | ${']0;1[' /* ...only if 0 is on the right side of the range */}
    ${']0;1['}                                    | ${']0;1['}
    ${'[-0.5;0.5]'}                               | ${'[-0.5;0.5]' /* -0.5 and 0.5 being non-integers we need them in the range */}
    ${']-0.5;0.5['}                               | ${']-0.5;0.5[' /* the double right after -0.5 and the one right before 0.5 are also non-integers */}
    ${'[-4503599627370495.5;4503599627370495.5]'} | ${'[-4503599627370495.5;4503599627370495.5]'}
  `('should update $sourceRange into $targetRange', ({ sourceRange, targetRange }) => {
    // Arrange
    // Note: We could also try to optimize ranges such as:
    // >  ]-4503599627370495.5;4503599627370495.5[ -> ]-4503599627370495;4503599627370495[
    const sourceConstraints: DoubleConstraints = {
      minExcluded: sourceRange.at(0) === ']',
      maxExcluded: sourceRange.at(-1) === '[',
      min: Number(sourceRange.substring(1).split(';')[0]),
      max: Number(sourceRange.substring(0, sourceRange.length - 1).split(';')[1]),
    };
    const targetConstraints: DoubleConstraints = {
      minExcluded: targetRange.at(0) === ']',
      maxExcluded: targetRange.at(-1) === '[',
      min: Number(targetRange.substring(1).split(';')[0]),
      max: Number(targetRange.substring(0, targetRange.length - 1).split(';')[1]),
    };

    // Act / Assert
    expect(refineConstraintsForDoubleOnly(sourceConstraints)).toStrictEqual(expect.objectContaining(targetConstraints));
  });

  describe('no excluded', () => {
    it('should properly refine default constraints', () => {
      // Arrange / Act / Assert
      expect(refineConstraintsForDoubleOnly({})).toStrictEqual({
        minExcluded: false,
        min: -onlyIntegersAfterThisValue, // min included, but its value will be replaced by -inf in mapper
        maxExcluded: false,
        max: onlyIntegersAfterThisValue, // max included, but its value will be replaced by +inf in mapper
        noDefaultInfinity: false,
        noNaN: false,
      });
    });

    it('should properly refine when constraints reject infinities', () => {
      // Arrange / Act / Assert
      expect(refineConstraintsForDoubleOnly({ noDefaultInfinity: true })).toStrictEqual({
        minExcluded: false,
        min: -maxNonIntegerValue,
        maxExcluded: false,
        max: maxNonIntegerValue,
        noDefaultInfinity: false,
        noNaN: false,
      });
    });

    it('should properly refine when constraints ask for onlyIntegersAfterThisValue or above (excluding infinite)', () => {
      fc.assert(
        fc.property(
          fc.double({ noDefaultInfinity: true, noNaN: true, min: onlyIntegersAfterThisValue }),
          (boundary) => {
            // Arrange / Act / Assert
            expect(refineConstraintsForDoubleOnly({ min: -boundary, max: boundary })).toStrictEqual({
              minExcluded: false,
              min: -maxNonIntegerValue, // min has been adapted to better fit the float range
              maxExcluded: false,
              max: maxNonIntegerValue, // max has been adapted to better fit the float range
              noDefaultInfinity: false,
              noNaN: false,
            });
          },
        ),
      );
    });

    it('should properly refine when constraints ask for maxNonIntegerValue or below', () => {
      fc.assert(
        fc.property(fc.double({ noNaN: true, min: 1, max: maxNonIntegerValue }), (boundary) => {
          // Arrange / Act / Assert
          expect(refineConstraintsForDoubleOnly({ min: -boundary, max: boundary })).toStrictEqual({
            minExcluded: Number.isInteger(-boundary),
            min: -boundary, // min was already in the accepted range
            maxExcluded: Number.isInteger(boundary),
            max: boundary, // max was already in the accepted range
            noDefaultInfinity: false,
            noNaN: false,
          });
        }),
      );
    });
  });

  describe('with excluded', () => {
    const excluded = { minExcluded: true, maxExcluded: true };

    it('should properly refine default constraints', () => {
      // Arrange / Act / Assert
      expect(refineConstraintsForDoubleOnly({ ...excluded })).toStrictEqual({
        minExcluded: true,
        min: -onlyIntegersAfterThisValue, // min excluded so it only starts at -maxNonIntegerValue
        maxExcluded: true,
        max: onlyIntegersAfterThisValue, /// min excluded so it only starts at -maxNonIntegerValue
        noDefaultInfinity: false,
        noNaN: false,
      });
    });

    it('should properly refine when constraints reject infinities', () => {
      // Arrange / Act / Assert
      expect(refineConstraintsForDoubleOnly({ ...excluded, noDefaultInfinity: true })).toStrictEqual({
        minExcluded: true,
        min: -onlyIntegersAfterThisValue, // min excluded so it only starts at -maxNonIntegerValue
        maxExcluded: true,
        max: onlyIntegersAfterThisValue, // min excluded so it only starts at -maxNonIntegerValue
        noDefaultInfinity: false,
        noNaN: false,
      });
    });

    it('should properly refine when constraints ask for onlyIntegersAfterThisValue or above (excluding infinite)', () => {
      fc.assert(
        fc.property(
          fc.double({ noDefaultInfinity: true, noNaN: true, min: onlyIntegersAfterThisValue }),
          (boundary) => {
            // Arrange / Act / Assert
            expect(refineConstraintsForDoubleOnly({ ...excluded, min: -boundary, max: boundary })).toStrictEqual({
              minExcluded: true,
              min: -onlyIntegersAfterThisValue, // min has been adapted to better fit the float range, values only starts at -maxNonIntegerValue
              maxExcluded: true,
              max: onlyIntegersAfterThisValue, // max has been adapted to better fit the float range, values only starts at maxNonIntegerValue
              noDefaultInfinity: false,
              noNaN: false,
            });
          },
        ),
      );
    });

    it('should properly refine when constraints ask for maxNonIntegerValue or below', () => {
      fc.assert(
        fc.property(fc.double({ noNaN: true, min: 1, max: maxNonIntegerValue }), (boundary) => {
          // Arrange / Act / Assert
          expect(refineConstraintsForDoubleOnly({ ...excluded, min: -boundary, max: boundary })).toStrictEqual({
            minExcluded: true,
            min: -boundary, // min was already in the accepted range
            maxExcluded: true,
            max: boundary, // max was already in the accepted range
            noDefaultInfinity: false,
            noNaN: false,
          });
        }),
      );
    });
  });
});

// Helpers

function nextDouble(value: number): number {
  const index = doubleToIndex(value);
  const nextIndex = index + BigInt(1);
  return indexToDouble(nextIndex);
}
