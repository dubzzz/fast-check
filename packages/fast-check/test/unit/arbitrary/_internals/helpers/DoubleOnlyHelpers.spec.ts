import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { doubleToIndex, indexToDouble } from '../../../../../src/arbitrary/_internals/helpers/DoubleHelpers';
import {
  maxNonIntegerValue,
  onlyIntegersAfterThisValue,
  refineConstraintsForDoubleOnly,
} from '../../../../../src/arbitrary/_internals/helpers/DoubleOnlyHelpers';
import { add64 } from '../../../../../src/arbitrary/_internals/helpers/ArrayInt64';

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
  describe('no excluded', () => {
    it('should properly refine default constraints', () => {
      // Arrange / Act / Assert
      expect(refineConstraintsForDoubleOnly({})).toEqual({
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
      expect(refineConstraintsForDoubleOnly({ noDefaultInfinity: true })).toEqual({
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
            expect(refineConstraintsForDoubleOnly({ min: -boundary, max: boundary })).toEqual({
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
          expect(refineConstraintsForDoubleOnly({ min: -boundary, max: boundary })).toEqual({
            minExcluded: false,
            min: -boundary, // min was already in the accepted range
            maxExcluded: false,
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
      expect(refineConstraintsForDoubleOnly({ ...excluded })).toEqual({
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
      expect(refineConstraintsForDoubleOnly({ ...excluded, noDefaultInfinity: true })).toEqual({
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
            expect(refineConstraintsForDoubleOnly({ ...excluded, min: -boundary, max: boundary })).toEqual({
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
          expect(refineConstraintsForDoubleOnly({ ...excluded, min: -boundary, max: boundary })).toEqual({
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
  const nextIndex = add64(index, { sign: 1, data: [0, 1] });
  return indexToDouble(nextIndex);
}
