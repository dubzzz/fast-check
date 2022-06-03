import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`FloatArbitrary (seed: ${seed})`, () => {
  describe('float', () => {
    const limitedNumRuns = 1000;
    const numRuns = 25000;
    const sampleFloat = fc.sample(fc.float(), { seed, numRuns });
    const sampleFloatNoBias = fc.sample(fc.float().noBias(), { seed, numRuns });

    function shouldGenerate(expectedValue: number) {
      it('Should be able to generate ' + fc.stringify(expectedValue), () => {
        const hasValue = sampleFloat.findIndex((v) => Object.is(v, expectedValue)) !== -1;
        expect(hasValue).toBe(true);
      });
      it('Should not be able to generate ' + fc.stringify(expectedValue) + ' if not biased (very unlikely)', () => {
        const hasValue = sampleFloatNoBias.findIndex((v) => Object.is(v, expectedValue)) !== -1;
        expect(hasValue).toBe(false);
      });
    }

    const extremeValues = [
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.NaN,
      0,
      -0,
      2 ** -126 * 2 ** -23, // Number.MIN_VALUE for 32-bit floats
      -(2 ** -126 * 2 ** -23), // -Number.MIN_VALUE for 32-bit floats
      2 ** 127 * (1 + (2 ** 23 - 1) / 2 ** 23), // Number.MAX_VALUE for 32-bit floats
      -(2 ** 127 * (1 + (2 ** 23 - 1) / 2 ** 23)), // -Number.MAX_VALUE for 32-bit floats
    ];
    for (const extremeValue of extremeValues) {
      // Should be able to generate an exact extreme value in {numRuns} runs
      // The set of possible values for floats is of 4_278_190_083 distinct values (incl. nan, -/+inf)
      shouldGenerate(extremeValue);
    }
    it(`Should be able to generate one of the extreme values in a limited amount of runs (${limitedNumRuns})`, () => {
      const hasValue =
        sampleFloat.slice(0, limitedNumRuns).findIndex((v) => {
          // Check if we can find one of the extreme values in our limited sample
          return extremeValues.findIndex((expectedValue) => Object.is(v, expectedValue)) !== -1;
        }) !== -1;
      expect(hasValue).toBe(true);
    });

    // Remark:
    //   MIN_VALUE_32 = (2**-126) * (2**-23)
    //   In range: [MIN_VALUE_32 ; 2 ** -125[ there are 2**24 distinct values
    // Remark:
    //   MAX_VALUE_32 = (2**127) * (2 - 2**-23)
    //   In range: [2**127 ; MAX_VALUE_32] there are 2**23 distinct values
    //
    // If we join those 4 ranges (including negative versions), they only represent 1.176 % of all the possible values.
    // Indeed there are 4_278_190_080 distinct values for double if we exclude -infinity, +infinty and NaN.
    // So most of the generated values should be in the union of the ranges ]-2**127 ; -2**-125] and [2**-125 ; 2**127[.

    const filterIntermediateValues = (sample: number[]) => {
      return sample.filter((v) => {
        const absV = Math.abs(v);
        return absV >= 2 ** -125 && absV < 2 ** 127;
      });
    };

    it('Should be able to generate intermediate values most of the time even if biased', () => {
      const countIntermediate = filterIntermediateValues(sampleFloat).length;
      expect(countIntermediate).toBeGreaterThan(0.5 * sampleFloat.length);
    });

    it('Should be able to generate intermediate values most of the time if not biased', () => {
      const countIntermediate = filterIntermediateValues(sampleFloatNoBias).length;
      expect(countIntermediate).toBeGreaterThan(0.5 * sampleFloatNoBias.length);
    });
  });
});
