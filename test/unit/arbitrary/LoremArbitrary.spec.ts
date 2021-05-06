import * as prand from 'pure-rand';
import * as fc from '../../../lib/fast-check';

import { lorem } from '../../../src/arbitrary/lorem';
import { Random } from '../../../src/random/generator/Random';

import { generateOneValue } from '../check/arbitrary/generic/GenerateOneValue';

describe('LoremArbitrary', () => {
  describe('lorem', () => {
    it('Should generate the same text with the same random', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng1 = new Random(prand.xorshift128plus(seed));
          const mrng2 = new Random(prand.xorshift128plus(seed));
          const g1 = lorem().generate(mrng1).value;
          const g2 = lorem().generate(mrng2).value;
          expect(g1).toEqual(g2);
          return true;
        })
      ));
    it('Should generate words by default', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(0, 100), (seed, num) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const g = lorem({ maxCount: num }).generate(mrng).value;
          expect(g).not.toContain('.');
        })
      ));
    it('Should not generate commas for words', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(0, 100), (seed, num) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const g = lorem({ maxCount: num }).generate(mrng).value;
          expect(g).not.toContain(',');
        })
      ));
    it('Should generate sentences ending by dot', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const g = lorem({ mode: 'sentences' }).generate(mrng).value;
          expect(g).toContain('.');
          expect(g[g.length - 1]).toEqual('.');

          // we remove the trailing dot at the end of the generated string
          // we remove the leading space for sentences with index greater than 0
          const sentences = g
            .substr(0, g.length - 1)
            .split('.')
            .map((s, i) => (i === 0 ? s : s.substring(1)));
          for (const s of sentences) {
            expect(s).not.toEqual('');
            expect(s).toMatch(/^[A-Z](, | )?([a-z]+(, | )?)*$/);
          }
          expect(sentences.length).toBeGreaterThanOrEqual(1);
          expect(sentences.length).toBeLessThanOrEqual(5);
        })
      ));

    describe('Still support non recommended signatures', () => {
      it('Should support fc.lorem(maxWordsCount)', () => {
        fc.assert(
          fc.property(fc.integer(), fc.nat(100), (seed, maxWordsCount) => {
            const refArbitrary = lorem({ maxCount: maxWordsCount });
            const nonRecommendedArbitrary = lorem(maxWordsCount);
            expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
      it('Should support fc.lorem(maxWordsCount, sentencesMode)', () => {
        fc.assert(
          fc.property(fc.integer(), fc.nat(100), fc.boolean(), (seed, maxWordsCount, sentencesMode) => {
            const refArbitrary = lorem({ maxCount: maxWordsCount, mode: sentencesMode ? 'sentences' : 'words' });
            const nonRecommendedArbitrary = lorem(maxWordsCount, sentencesMode);
            expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
    });
  });
});
