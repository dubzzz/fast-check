import { date } from '../../../../src/check/arbitrary/DateArbitrary';
import * as fc from '../../../../lib/fast-check';
import * as genericHelper from './generic/GenericArbitraryHelper';

const isValidDate = (date: Date) => {
  return date instanceof Date && !isNaN(date.getTime());
};

describe('DateArbitrary', () => {
  describe('date', () => {
    it('Should throw when minimum date is greater than maximum one', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (a, b) => {
          fc.pre(a !== b);
          if (a < b) expect(() => date({ min: new Date(b), max: new Date(a) })).toThrowError();
          else expect(() => date({ min: new Date(a), max: new Date(b) })).toThrowError();
        })
      ));

    genericHelper.isValidArbitrary(() => date(), {
      isValidValue: (g: Date) => isValidDate(g)
    });

    genericHelper.isValidArbitrary(() => date({ min: new Date(0) }), {
      isValidValue: (g: Date) => g >= new Date(0)
    });

    genericHelper.isValidArbitrary(() => date({ max: new Date(0) }), {
      isValidValue: (g: Date) => g <= new Date(0)
    });

    genericHelper.isValidArbitrary(() => date({ min: new Date(-10), max: new Date(10) }), {
      isValidValue: (g: Date) => g <= new Date(10) && g >= new Date(-10)
    });
  });
});
