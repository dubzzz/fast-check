import fc from '../../../lib/fast-check';
import { date } from '../../../src/arbitrary/date';
import { fakeNextArbitrary } from '../check/arbitrary/generic/NextArbitraryHelpers';
import { convertFromNextWithShrunkOnce, convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import {
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesCorrectValues,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesCorrectValues,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesStrictlySmallerValue,
} from '../check/arbitrary/generic/NextArbitraryAssertions';

import * as _IntegerMock from '../../../src/arbitrary/integer';
import { ArbitraryWithShrink } from '../../../src/check/arbitrary/definition/ArbitraryWithShrink';
const IntegerMock: { integer: (min: number, max: number) => ArbitraryWithShrink<number> } = _IntegerMock;

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('date', () => {
  it('should map on the output of an integer and specify mapper and unmapper', () =>
    fc.assert(
      fc.property(constraintsArb(), (constraints) => {
        // Arrange
        const { instance, map } = fakeNextArbitrary<number>();
        const { instance: mappedInstance } = fakeNextArbitrary<Date>();
        const integer = jest.spyOn(IntegerMock, 'integer');
        integer.mockImplementation(() => convertFromNextWithShrunkOnce(instance, undefined));
        map.mockReturnValue(mappedInstance);

        // Act
        const arb = date(constraints);

        // Assert
        expect(convertToNext(arb)).toBe(mappedInstance);
        expect(integer).toHaveBeenCalledTimes(1);
        expect(map).toHaveBeenCalledTimes(1);
        expect(map).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
      })
    ));

  it('should always map the minimal value of the internal integer to the requested minimal date', () =>
    fc.assert(
      fc.property(constraintsArb(), (constraints) => {
        // Arrange
        const { instance, map } = fakeNextArbitrary<number>();
        const { instance: mappedInstance } = fakeNextArbitrary<Date>();
        const integer = jest.spyOn(IntegerMock, 'integer');
        integer.mockImplementation(() => convertFromNextWithShrunkOnce(instance, undefined));
        map.mockReturnValue(mappedInstance);

        // Act
        date(constraints);
        const [rangeMin] = integer.mock.calls[0];
        const [mapper] = map.mock.calls[0];
        const minDate = mapper(rangeMin) as Date;

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
      })
    ));

  it('should always map the maximal value of the internal integer to the requested maximal date', () =>
    fc.assert(
      fc.property(constraintsArb(), (constraints) => {
        // Arrange
        const { instance, map } = fakeNextArbitrary<number>();
        const { instance: mappedInstance } = fakeNextArbitrary<Date>();
        const integer = jest.spyOn(IntegerMock, 'integer');
        integer.mockImplementation(() => convertFromNextWithShrunkOnce(instance, undefined));
        map.mockReturnValue(mappedInstance);

        // Act
        date(constraints);
        const [, rangeMax] = integer.mock.calls[0];
        const [mapper] = map.mock.calls[0];
        const maxDate = mapper(rangeMax) as Date;

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
      })
    ));

  it('should always generate dates between min and max given the range and the mapper', () =>
    fc.assert(
      fc.property(constraintsArb(), fc.maxSafeNat(), (constraints, mod) => {
        // Arrange
        const { instance, map } = fakeNextArbitrary<number>();
        const { instance: mappedInstance } = fakeNextArbitrary<Date>();
        const integer = jest.spyOn(IntegerMock, 'integer');
        integer.mockImplementation(() => convertFromNextWithShrunkOnce(instance, undefined));
        map.mockReturnValue(mappedInstance);

        // Act
        date(constraints);
        const [rangeMin, rangeMax] = integer.mock.calls[0];
        const [mapper] = map.mock.calls[0];
        const d = mapper(rangeMin + (mod % (rangeMax - rangeMin + 1))) as Date;

        // Assert
        expect(d.getTime()).not.toBe(Number.NaN);
        if (constraints.min) expect(d.getTime()).toBeGreaterThanOrEqual(constraints.min.getTime());
        if (constraints.max) expect(d.getTime()).toBeLessThanOrEqual(constraints.max.getTime());
      })
    ));

  it('should throw whenever min is an invalid date', () =>
    fc.assert(
      fc.property(invalidMinConstraintsArb(), (constraints) => {
        // Act / Assert
        expect(() => date(constraints)).toThrowError();
      })
    ));

  it('should throw whenever max is an invalid date', () =>
    fc.assert(
      fc.property(invalidMaxConstraintsArb(), (constraints) => {
        // Act / Assert
        expect(() => date(constraints)).toThrowError();
      })
    ));

  it('should throw whenever min is greater than max', () =>
    fc.assert(
      fc.property(invalidRangeConstraintsArb(), (constraints) => {
        // Act / Assert
        expect(() => date(constraints)).toThrowError();
      })
    ));
});

describe('date (integration)', () => {
  type Extra = { min?: Date; max?: Date };
  const extraParameters: fc.Arbitrary<Extra> = constraintsArb();

  const isCorrect = (d: Date, extra: Extra) => {
    expect(d.getTime()).not.toBe(Number.NaN);
    if (extra.min) expect(d.getTime()).toBeGreaterThanOrEqual(extra.min.getTime());
    if (extra.max) expect(d.getTime()).toBeLessThanOrEqual(extra.max.getTime());
  };

  const isStrictlySmaller = (d1: Date, d2: Date) =>
    Math.abs(d1.getTime() - new Date(0).getTime()) < Math.abs(d2.getTime() - new Date(0).getTime());

  const dateBuilder = (extra: Extra) => convertToNext(date(extra));

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(dateBuilder, { extraParameters });
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(dateBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(dateBuilder, { extraParameters });
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(dateBuilder, { extraParameters });
  });

  it('should be able to shrink without any context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(dateBuilder, { extraParameters });
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(dateBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(dateBuilder, { extraParameters });
  });

  it('should preserve strictly smaller ordering in shrink', () => {
    assertShrinkProducesStrictlySmallerValue(dateBuilder, isStrictlySmaller, { extraParameters });
  });
});

// Helpers

function constraintsArb() {
  return fc.tuple(fc.date(), fc.date(), fc.boolean(), fc.boolean()).map(([d1, d2, withMin, withMax]) => {
    const min = d1 < d2 ? d1 : d2;
    const max = d1 < d2 ? d2 : d1;
    return { min: withMin ? min : undefined, max: withMax ? max : undefined };
  });
}

function invalidRangeConstraintsArb() {
  return fc.tuple(fc.date(), fc.date()).map(([d1, d2]) => {
    const min = d1 < d2 ? d1 : d2;
    const max = d1 < d2 ? d2 : d1;
    return { min: max, max: min };
  });
}

function invalidMinConstraintsArb() {
  return fc.option(fc.date(), { freq: 100, nil: undefined }).map((max) => ({ min: new Date(Number.NaN), max }));
}

function invalidMaxConstraintsArb() {
  return fc.option(fc.date(), { freq: 100, nil: undefined }).map((min) => ({ min, max: new Date(Number.NaN) }));
}
