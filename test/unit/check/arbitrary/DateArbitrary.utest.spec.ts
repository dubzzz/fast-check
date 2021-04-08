import { date } from '../../../../src/check/arbitrary/DateArbitrary';
import * as stubRng from '../../stubs/generators';
import { mocked } from 'ts-jest/utils';
import * as fc from '../../../../lib/fast-check';
import { ArbitraryWithShrink } from '../../../../src/check/arbitrary/definition/ArbitraryWithShrink';

jest.mock('../../../../src/arbitrary/integer');
import * as _IntegerMock from '../../../../src/arbitrary/integer';
import { arbitraryFor } from './generic/ArbitraryBuilder';

const IntegerArbitraryMock: { integer: (min: number, max: number) => ArbitraryWithShrink<number> } = _IntegerMock;

const mrng = () => stubRng.mutable.nocall();

describe('DateArbitrary', () => {
  describe('date', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('Should be able to build the minimal valid date', () => {
      // Arrange
      const { integer } = mocked(IntegerArbitraryMock);
      integer.mockImplementationOnce((a, _b) => arbitraryFor([{ value: a }]));

      // Act
      const arb = date();
      const { value_: d } = arb.generate(mrng());

      // Assert
      expect(d).toBeInstanceOf(Date);
      expect(d.getTime()).not.toBe(Number.NaN);
      expect(new Date(d.getTime() - 1).getTime()).toBe(Number.NaN);
    });
    it('Should be able to build the maximal valid date', () => {
      // Arrange
      const { integer } = mocked(IntegerArbitraryMock);
      integer.mockImplementationOnce((a, b) => arbitraryFor([{ value: b }]));

      // Act
      const arb = date();
      const { value_: d } = arb.generate(mrng());

      // Assert
      expect(d).toBeInstanceOf(Date);
      expect(d.getTime()).not.toBe(Number.NaN);
      expect(new Date(d.getTime() + 1).getTime()).toBe(Number.NaN);
    });
    it('Should always produce valid dates between min and max (if specified)', () => {
      fc.assert(
        fc
          .property(constraintsArb(), fc.nat(), (constraints, seed) => {
            // Arrange
            const { integer } = mocked(IntegerArbitraryMock);
            integer.mockImplementationOnce((a, b) => {
              const d = b - a + 1;
              const r = (seed % d) + a; // random between a and b
              return arbitraryFor([{ value: r }]);
            });

            // Act
            const arb = date(constraints);
            const { value_: d } = arb.generate(mrng());

            // Assert
            expect(d.getTime()).not.toBe(Number.NaN);
            if (constraints.min) expect(d.getTime()).toBeGreaterThanOrEqual(constraints.min.getTime());
            if (constraints.max) expect(d.getTime()).toBeLessThanOrEqual(constraints.max.getTime());
          })
          .beforeEach(() => {
            jest.clearAllMocks();
          })
      );
    });
    it('Should throw whenever min is an invalid date', () => {
      fc.assert(
        fc.property(invalidMinConstraintsArb(), (constraints) => {
          // Act / Assert
          expect(() => date(constraints)).toThrowError();
        })
      );
    });
    it('Should throw whenever max is an invalid date', () => {
      fc.assert(
        fc.property(invalidMaxConstraintsArb(), (constraints) => {
          // Act / Assert
          expect(() => date(constraints)).toThrowError();
        })
      );
    });
    it('Should throw whenever min is greater than max', () => {
      fc.assert(
        fc.property(invalidRangeConstraintsArb(), (constraints) => {
          // Act / Assert
          expect(() => date(constraints)).toThrowError();
        })
      );
    });
    it('Should preserve shrinking capabilities', () => {
      // Arrange
      const { integer } = mocked(IntegerArbitraryMock);
      integer.mockReturnValueOnce(arbitraryFor([{ value: 42, shrinks: [{ value: 48 }, { value: 69 }] }]));

      // Act
      const arb = date();
      const { shrink } = arb.generate(mrng());
      const shrinks = [...shrink()].map((s) => s.value_);

      // Assert
      expect(shrinks).toEqual([new Date(48), new Date(69)]);
    });
  });
});

// Arbitraries

const constraintsArb = () =>
  fc.tuple(fc.date(), fc.date(), fc.boolean(), fc.boolean()).map(([d1, d2, withMin, withMax]) => {
    const min = d1 < d2 ? d1 : d2;
    const max = d1 < d2 ? d2 : d1;
    return { min: withMin ? min : undefined, max: withMax ? max : undefined };
  });

const invalidRangeConstraintsArb = () =>
  fc.tuple(fc.date(), fc.date()).map(([d1, d2]) => {
    const min = d1 < d2 ? d1 : d2;
    const max = d1 < d2 ? d2 : d1;
    return { min: max, max: min };
  });

const invalidMinConstraintsArb = () =>
  fc
    .option(fc.date(), { freq: 100 })
    .map((optMax) => optMax || undefined)
    .map((max) => ({ min: new Date(Number.NaN), max }));

const invalidMaxConstraintsArb = () =>
  fc
    .option(fc.date(), { freq: 100 })
    .map((optMin) => optMin || undefined)
    .map((min) => ({ min, max: new Date(Number.NaN) }));
