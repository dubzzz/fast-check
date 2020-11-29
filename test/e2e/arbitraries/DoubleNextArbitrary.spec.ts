import * as fc from '../../../src/fast-check';

const seed = Date.now();

describe(`DoubleNextArbitrary (seed: ${seed})`, () => {
  describe('doubleNext', () => {
    const numRuns = 10000;
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

    shouldGenerate(Number.POSITIVE_INFINITY);
    shouldGenerate(Number.NEGATIVE_INFINITY);
    shouldGenerate(Number.NaN);
    shouldGenerate(0);
    shouldGenerate(-0);
    shouldGenerate(Number.MIN_VALUE);
    shouldGenerate(-Number.MIN_VALUE);
    shouldGenerate(Number.MAX_VALUE);
    shouldGenerate(-Number.MAX_VALUE);

    // Remark: Number.MIN_VALUE = (2**-1022) * (2**-52)
    // Remark: Number.MAX_VALUE = (2**1023) * (2 - 2**-52)
    // In range: [Number.MIN_VALUE ; 2 ** -1021[ there are 2**53 distinct values
    // In range: [2**1023 ; Number.MAX_VALUE] there are 2**52 distinct values
    // They represent 0.07 % of all the possible values
    // (indeed there are 18437736874454810624 distinct values for double without -infinity, +infinty and NaN)
    const filterIntermediateValues = (sample: number[]) => {
      return sample.filter((v) => v >= 2 ** -1021 && v < 2 ** 1023);
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
