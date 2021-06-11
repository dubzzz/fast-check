import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`DoubleNextArbitrary (seed: ${seed})`, () => {
  describe('doubleNext', () => {
    const limitedNumRuns = 1000;
    const numRuns = 25000;
    const sampleDoubleNext = fc.sample(fc.double({ next: true }), { seed, numRuns });
    const sampleDoubleNextNoBias = fc.sample(fc.double({ next: true }).noBias(), { seed, numRuns });

    function shouldGenerate(expectedValue: number) {
      it('Should be able to generate ' + fc.stringify(expectedValue), () => {
        const hasValue = sampleDoubleNext.findIndex((v) => Object.is(v, expectedValue)) !== -1;
        expect(hasValue).toBe(true);
      });
      it('Should not be able to generate ' + fc.stringify(expectedValue) + ' if not biased (very unlikely)', () => {
        const hasValue = sampleDoubleNextNoBias.findIndex((v) => Object.is(v, expectedValue)) !== -1;
        expect(hasValue).toBe(false);
      });
    }

    const extremeValues = [
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.NaN,
      0,
      -0,
      Number.MIN_VALUE,
      -Number.MIN_VALUE,
      Number.MAX_VALUE,
      -Number.MAX_VALUE,
    ];
    for (const extremeValue of extremeValues) {
      // Should be able to generate an exact extreme value in {numRuns} runs
      // The set of possible values for doubles is of 18_437_736_874_454_810_627 distinct values (incl. nan, -/+inf)
      shouldGenerate(extremeValue);
    }
    it(`Should be able to generate one of the extreme values in a limited amount of runs (${limitedNumRuns})`, () => {
      const hasValue =
        sampleDoubleNext.slice(0, limitedNumRuns).findIndex((v) => {
          // Check if we can find one of the extreme values in our limited sample
          return extremeValues.findIndex((expectedValue) => Object.is(v, expectedValue)) !== -1;
        }) !== -1;
      expect(hasValue).toBe(true);
    });

    // Remark:
    //   Number.MIN_VALUE = (2**-1022) * (2**-52)
    //   In range: [Number.MIN_VALUE ; 2 ** -1021[ there are 2**53 distinct values
    // Remark:
    //   Number.MAX_VALUE = (2**1023) * (2 - 2**-52)
    //   In range: [2**1023 ; Number.MAX_VALUE] there are 2**52 distinct values
    //
    // If we join those 4 ranges (including negative versions), they only represent 0.147 % of all the possible values.
    // Indeed there are 18_437_736_874_454_810_624 distinct values for double if we exclude -infinity, +infinty and NaN.
    // So most of the generated values should be in the union of the ranges ]-2**1023 ; -2**-1021] and [2**-1021 ; 2**1023[.

    const filterIntermediateValues = (sample: number[]) => {
      return sample.filter((v) => {
        const absV = Math.abs(v);
        return absV >= 2 ** -1021 && absV < 2 ** 1023;
      });
    };

    it('Should be able to generate intermediate values most of the time even if biased', () => {
      const countIntermediate = filterIntermediateValues(sampleDoubleNext).length;
      expect(countIntermediate).toBeGreaterThan(0.5 * sampleDoubleNext.length);
    });

    it('Should be able to generate intermediate values most of the time if not biased', () => {
      const countIntermediate = filterIntermediateValues(sampleDoubleNextNoBias).length;
      expect(countIntermediate).toBeGreaterThan(0.5 * sampleDoubleNextNoBias.length);
    });
  });
});
