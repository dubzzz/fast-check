import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { date } from '../../../src/arbitrary/date';
import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';
import {
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertProduceCorrectValues,
  assertShrinkProducesStrictlySmallerValue,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/ArbitraryAssertions';

import * as IntegerMock from '../../../src/arbitrary/integer';
import { declareCleaningHooksForSpies } from './__test-helpers__/SpyCleaner';

describe('date', () => {
  declareCleaningHooksForSpies();

  it('should map on the output of an integer and specify mapper and unmapper', () =>
    fc.assert(
      fc.property(constraintsArb(), (constraints) => {
        // Arrange
        const { instance, map } = fakeArbitrary<number>();
        const { instance: mappedInstance } = fakeArbitrary<Date>();
        const integer = vi.spyOn(IntegerMock, 'integer');
        integer.mockReturnValue(instance);
        map.mockReturnValue(mappedInstance);

        // Act
        const arb = date(constraints);

        // Assert
        expect(arb).toBe(mappedInstance);
        expect(integer).toHaveBeenCalledTimes(1);
        expect(map).toHaveBeenCalledTimes(1);
        expect(map).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
      }),
    ));

  it('should always map the minimal value of the internal integer to the requested minimal date', () =>
    fc.assert(
      fc.property(constraintsArb(), (constraints) => {
        // Arrange
        const { instance, map } = fakeArbitrary<number>();
        const { instance: mappedInstance } = fakeArbitrary<Date>();
        const integer = vi.spyOn(IntegerMock, 'integer');
        integer.mockReturnValue(instance);
        map.mockReturnValue(mappedInstance);

        // Act
        date(constraints);
        const { min: rangeMin } = integer.mock.calls[0][0]!;
        const [mapper] = map.mock.calls[0];
        const minDate = mapper(rangeMin!) as Date;

        // Assert
        if (constraints.min !== undefined) {
          // If min was specified,
          // the lowest value of the range requested to integer should map to it
          expect(minDate).toEqual(constraints.min);
        } else {
          // If min was not specified,
          // the lowest value of the range requested to integer should map to the smallest possible Date
          expect(minDate.getTime()).not.toBe(Number.NaN);
          expect(new Date(minDate.getTime() - 1).getTime()).toBe(Number.NaN);
        }
      }),
    ));

  it('should always map the maximal value (minus one if NaN accepted) of the internal integer to the requested maximal date', () =>
    fc.assert(
      fc.property(constraintsArb(), (constraints) => {
        // Arrange
        const withInvalidDates = !constraints.noInvalidDate;
        const { instance, map } = fakeArbitrary<number>();
        const { instance: mappedInstance } = fakeArbitrary<Date>();
        const integer = vi.spyOn(IntegerMock, 'integer');
        integer.mockReturnValue(instance);
        map.mockReturnValue(mappedInstance);

        // Act
        date(constraints);
        const { max: rangeMax } = integer.mock.calls[0][0]!;
        const [mapper] = map.mock.calls[0];
        const maxDate = mapper(withInvalidDates ? rangeMax! - 1 : rangeMax!) as Date;

        // Assert
        if (constraints.max !== undefined) {
          // If max was specified,
          // the highest value of the range requested to integer should map to it
          expect(maxDate).toEqual(constraints.max);
        } else {
          // If max was not specified,
          // the highest value of the range requested to integer should map to the highest possible Date
          expect(maxDate.getTime()).not.toBe(Number.NaN);
          expect(new Date(maxDate.getTime() + 1).getTime()).toBe(Number.NaN);
        }
      }),
    ));

  it('should always generate dates between min and max (or invalid ones when accepted) given the range and the mapper', () =>
    fc.assert(
      fc.property(constraintsArb(), fc.maxSafeNat(), (constraints, mod) => {
        // Arrange
        const { instance, map } = fakeArbitrary<number>();
        const { instance: mappedInstance } = fakeArbitrary<Date>();
        const integer = vi.spyOn(IntegerMock, 'integer');
        integer.mockReturnValue(instance);
        map.mockReturnValue(mappedInstance);

        // Act
        date(constraints);
        const { min: rangeMin, max: rangeMax } = integer.mock.calls[0][0]!;
        const [mapper] = map.mock.calls[0];
        const d = mapper(rangeMin! + (mod % (rangeMax! - rangeMin! + 1))) as Date;

        // Assert
        if (constraints.noInvalidDate || !Number.isNaN(d.getTime())) {
          expect(d.getTime()).not.toBe(Number.NaN);
          if (constraints.min) expect(d.getTime()).toBeGreaterThanOrEqual(constraints.min.getTime());
          if (constraints.max) expect(d.getTime()).toBeLessThanOrEqual(constraints.max.getTime());
        }
      }),
    ));

  it('should throw whenever min is an invalid date', () =>
    fc.assert(
      fc.property(invalidMinConstraintsArb(), (constraints) => {
        // Act / Assert
        expect(() => date(constraints)).toThrowError();
      }),
    ));

  it('should throw whenever max is an invalid date', () =>
    fc.assert(
      fc.property(invalidMaxConstraintsArb(), (constraints) => {
        // Act / Assert
        expect(() => date(constraints)).toThrowError();
      }),
    ));

  it('should throw whenever min is greater than max', () =>
    fc.assert(
      fc.property(invalidRangeConstraintsArb(), (constraints) => {
        // Act / Assert
        expect(() => date(constraints)).toThrowError();
      }),
    ));
});

describe('date (integration)', () => {
  type Extra = { min?: Date; max?: Date; noInvalidDate?: boolean };
  const extraParameters: fc.Arbitrary<Extra> = constraintsArb();

  const isCorrect = (d: Date, extra: Extra) => {
    if (extra.noInvalidDate) {
      expect(d.getTime()).not.toBe(Number.NaN);
    } else if (Number.isNaN(d.getTime())) {
      return;
    }
    if (extra.min) expect(d.getTime()).toBeGreaterThanOrEqual(extra.min.getTime());
    if (extra.max) expect(d.getTime()).toBeLessThanOrEqual(extra.max.getTime());
  };

  const isEqual = (d1: Date, d2: Date) => {
    expect(d1.getTime()).toEqual(d2.getTime());
  };

  const isStrictlySmaller = (d1: Date, d2: Date) => {
    if (Number.isNaN(d1.getTime())) {
      expect(d2.getTime()).not.toBe(Number.NaN);
    } else if (Number.isNaN(d2.getTime())) {
      expect(d1.getTime()).not.toBe(Number.NaN);
    } else {
      return Math.abs(d1.getTime() - new Date(0).getTime()) < Math.abs(d2.getTime() - new Date(0).getTime());
    }
  };

  const dateBuilder = (extra: Extra) => date(extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(dateBuilder, { extraParameters, isEqual });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(dateBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(dateBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(dateBuilder, { extraParameters, isEqual });
  });

  it('should preserve strictly smaller ordering in shrink', () => {
    assertShrinkProducesStrictlySmallerValue(dateBuilder, isStrictlySmaller, { extraParameters });
  });
});

// Helpers

function constraintsArb() {
  return fc
    .tuple(
      fc.date({ noInvalidDate: true }),
      fc.date({ noInvalidDate: true }),
      fc.boolean(),
      fc.boolean(),
      fc.option(fc.boolean(), { nil: undefined }),
    )
    .map(([d1, d2, withMin, withMax, noInvalidDate]) => {
      const min = d1 < d2 ? d1 : d2;
      const max = d1 < d2 ? d2 : d1;
      return { min: withMin ? min : undefined, max: withMax ? max : undefined, noInvalidDate };
    });
}

function invalidRangeConstraintsArb() {
  return fc
    .tuple(
      fc.date({ noInvalidDate: true }),
      fc.date({ noInvalidDate: true }),
      fc.option(fc.boolean(), { nil: undefined }),
    )
    .filter(([d1, d2]) => +d1 !== +d2)
    .map(([d1, d2, noInvalidDate]) => {
      const min = d1 < d2 ? d1 : d2;
      const max = d1 < d2 ? d2 : d1;
      return { min: max, max: min, noInvalidDate };
    });
}

function invalidMinConstraintsArb() {
  return fc
    .tuple(fc.option(fc.date(), { freq: 100, nil: undefined }), fc.option(fc.boolean(), { nil: undefined }))
    .map(([max, noInvalidDate]) => ({ min: new Date(Number.NaN), max, noInvalidDate }));
}

function invalidMaxConstraintsArb() {
  return fc
    .tuple(fc.option(fc.date(), { freq: 100, nil: undefined }), fc.option(fc.boolean(), { nil: undefined }))
    .map(([min, noInvalidDate]) => ({ min, max: new Date(Number.NaN), noInvalidDate }));
}
