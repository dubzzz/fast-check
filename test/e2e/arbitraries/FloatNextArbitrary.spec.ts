import * as fc from '../../../src/fast-check';

const seed = Date.now();

describe(`FloatNextArbitrary (seed: ${seed})`, () => {
  describe('floatNext', () => {
    const numRuns = 10000;
    const sampleFloatNext = fc.sample(fc.float({ next: true }), { seed, numRuns });
    const sampleFloatNextNoBias = fc.sample(fc.float({ next: true }).noBias(), { seed, numRuns });

    function shouldGenerate(expectedValue: number) {
      it('Should be able to generate ' + fc.stringify(expectedValue), () => {
        const hasValue = sampleFloatNext.findIndex((v) => Object.is(v, expectedValue)) !== -1;
        expect(hasValue).toBe(true);
      });
      it('Should not be able to generate ' + fc.stringify(expectedValue) + ' if not biased (very unlikely)', () => {
        const hasValue = sampleFloatNextNoBias.findIndex((v) => Object.is(v, expectedValue)) !== -1;
        expect(hasValue).toBe(false);
      });
    }

    shouldGenerate(Number.POSITIVE_INFINITY);
    shouldGenerate(Number.NEGATIVE_INFINITY);
    shouldGenerate(Number.NaN);
    shouldGenerate(0);
    shouldGenerate(-0);
    shouldGenerate(2 ** -126 * 2 ** -23); // Number.MIN_VALUE for 32-bit floats
    shouldGenerate(-(2 ** -126 * 2 ** -23)); // -Number.MIN_VALUE for 32-bit floats
    shouldGenerate(2 ** 127 * (1 + (2 ** 23 - 1) / 2 ** 23)); // Number.MAX_VALUE for 32-bit floats
    shouldGenerate(-(2 ** 127 * (1 + (2 ** 23 - 1) / 2 ** 23))); // -Number.MAX_VALUE for 32-bit floats
  });
});
