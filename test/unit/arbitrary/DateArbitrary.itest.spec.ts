import { date } from '../../../src/arbitrary/date';
import * as genericHelper from '../check/arbitrary/generic/GenericArbitraryHelper';

const isValidDate = (date: Date) => {
  return date instanceof Date && !isNaN(date.getTime());
};

describe('DateArbitrary', () => {
  describe('date', () => {
    describe('Given no constraints', () => {
      genericHelper.isValidArbitrary(() => date(), {
        isValidValue: (g: Date) => isValidDate(g),
      });
    });
    describe('Given min constraint only', () => {
      genericHelper.isValidArbitrary(() => date({ min: new Date(0) }), {
        isValidValue: (g: Date) => isValidDate(g) && g >= new Date(0),
      });
    });
    describe('Given max constraint only', () => {
      genericHelper.isValidArbitrary(() => date({ max: new Date(0) }), {
        isValidValue: (g: Date) => isValidDate(g) && g <= new Date(0),
      });
    });
    describe('Given min and max constraints', () => {
      genericHelper.isValidArbitrary(() => date({ min: new Date(-10), max: new Date(10) }), {
        isValidValue: (g: Date) => isValidDate(g) && g <= new Date(10) && g >= new Date(-10),
      });
    });
  });
});
