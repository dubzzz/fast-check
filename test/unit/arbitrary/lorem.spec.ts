import fc from '../../../lib/fast-check';
import { lorem, LoremConstraints } from '../../../src/arbitrary/lorem';
import {
  assertProduceValuesShrinkableWithoutContext,
  assertProduceCorrectValues,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/ArbitraryAssertions';

describe('lorem', () => {
  it('should reject any negative or zero maxCount whatever the mode', () =>
    fc.assert(
      fc.property(
        fc.integer({ max: 0 }),
        fc.constantFrom(...([undefined, 'words', 'sentences'] as const)),
        (maxCount, mode) => {
          // Arrange / Act / Assert
          expect(() => lorem({ maxCount, mode })).toThrowError();
        }
      )
    ));
});

describe('lorem (integration)', () => {
  type Extra = LoremConstraints;
  const extraParameters: fc.Arbitrary<Extra> = fc.record(
    {
      maxCount: fc.integer({ min: 1, max: 100 }),
      mode: fc.constantFrom(...(['words', 'sentences'] as const)),
    },
    { requiredKeys: [] }
  );

  const isCorrect = (value: string, extra: Extra) => {
    const maxCount = extra.maxCount !== undefined ? extra.maxCount : 5;
    switch (extra.mode) {
      case 'sentences': {
        expect(value).toContain('.');
        expect(value[value.length - 1]).toEqual('.');
        const sentences = value
          // we remove the trailing dot at the end of the generated string
          .substr(0, value.length - 1)
          .split('.')
          // we remove the leading space for sentences with index greater than 0
          .map((s, i) => (i === 0 ? s : s.substring(1)));
        for (const s of sentences) {
          expect(s).not.toEqual('');
          expect(s).toMatch(/^[A-Z](, | )?([a-z]+(, | )?)*$/);
        }
        expect(sentences.length).toBeGreaterThanOrEqual(1);
        expect(sentences.length).toBeLessThanOrEqual(maxCount);
        break;
      }
      case 'words':
      default:
        expect(value).not.toContain('.');
        expect(value).not.toContain(',');
        expect(value.split(' ').length).toBeGreaterThanOrEqual(1);
        expect(value.split(' ').length).toBeLessThanOrEqual(maxCount);
        break;
    }
  };

  const loremBuilder = (extra: Extra) => lorem(extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(loremBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(loremBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(loremBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(loremBuilder, { extraParameters });
  });
});
