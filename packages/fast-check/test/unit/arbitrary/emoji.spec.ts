import { describe, it, expect } from 'vitest';
import { xorshift128plus } from 'pure-rand/generator/xorshift128plus';
import type { EmojiConstraints } from '../../../src/arbitrary/emoji.js';
import { emoji } from '../../../src/arbitrary/emoji.js';
import { Random } from '../../../src/random/generator/Random.js';
import fc from 'fast-check';
import {
  assertProduceSameValueGivenSameSeed,
  assertProduceCorrectValues,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions.js';

// Validation helpers

const emojiPresentationRegex = /^\p{Emoji_Presentation}$/u;

const skinToneModifiers = new Set([0x1f3fb, 0x1f3fc, 0x1f3fd, 0x1f3fe, 0x1f3ff]);

function isSkinToneEmoji(s: string): boolean {
  const cps = [...s];
  if (cps.length !== 2) return false;
  const modifierCp = cps[1].codePointAt(0)!;
  return skinToneModifiers.has(modifierCp);
}

function isFlagEmoji(s: string): boolean {
  const cps = [...s];
  if (cps.length !== 2) return false;
  const cp0 = cps[0].codePointAt(0)!;
  const cp1 = cps[1].codePointAt(0)!;
  return cp0 >= 0x1f1e6 && cp0 <= 0x1f1ff && cp1 >= 0x1f1e6 && cp1 <= 0x1f1ff;
}

function isKeycapEmoji(s: string): boolean {
  const cps = [...s];
  if (cps.length !== 3) return false;
  const cp1 = cps[1].codePointAt(0)!;
  const cp2 = cps[2].codePointAt(0)!;
  return cp1 === 0xfe0f && cp2 === 0x20e3;
}

function isAnyEmoji(s: string): boolean {
  if (emojiPresentationRegex.test(s)) return true;
  if (isSkinToneEmoji(s)) return true;
  if (isFlagEmoji(s)) return true;
  if (isKeycapEmoji(s)) return true;
  return false;
}

function randomFromSeed(seed: number): Random {
  return new Random(xorshift128plus(seed));
}

describe('emoji', () => {
  it('should generate a non-empty string', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const arb = emoji();
        const value = arb.generate(randomFromSeed(seed), undefined);
        expect(value.value.length).toBeGreaterThan(0);
      }),
    );
  });

  it('should generate single code point emoji with kind "single"', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const arb = emoji({ kind: 'single' });
        const value = arb.generate(randomFromSeed(seed), undefined);
        expect(emojiPresentationRegex.test(value.value)).toBe(true);
      }),
    );
  });

  it('should generate skin tone emoji with kind "skin-tone"', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const arb = emoji({ kind: 'skin-tone' });
        const value = arb.generate(randomFromSeed(seed), undefined);
        expect(isSkinToneEmoji(value.value)).toBe(true);
      }),
    );
  });

  it('should generate flag emoji with kind "flag"', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const arb = emoji({ kind: 'flag' });
        const value = arb.generate(randomFromSeed(seed), undefined);
        expect(isFlagEmoji(value.value)).toBe(true);
      }),
    );
  });

  it('should generate keycap emoji with kind "keycap"', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const arb = emoji({ kind: 'keycap' });
        const value = arb.generate(randomFromSeed(seed), undefined);
        expect(isKeycapEmoji(value.value)).toBe(true);
      }),
    );
  });

  it('should generate valid emoji with kind "any"', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const arb = emoji({ kind: 'any' });
        const value = arb.generate(randomFromSeed(seed), undefined);
        expect(isAnyEmoji(value.value)).toBe(true);
      }),
    );
  });
});

describe('emoji (integration)', () => {
  type Extra = EmojiConstraints;
  const extraParameters: fc.Arbitrary<Extra> = fc.record(
    {
      kind: fc.constantFrom(
        'any' as const,
        'single' as const,
        'skin-tone' as const,
        'flag' as const,
        'keycap' as const,
      ),
    },
    { requiredKeys: [] },
  );

  const isCorrect = (value: string, extra: Extra) => {
    const kind = extra.kind ?? 'any';
    switch (kind) {
      case 'single':
        expect(emojiPresentationRegex.test(value)).toBe(true);
        break;
      case 'skin-tone':
        expect(isSkinToneEmoji(value)).toBe(true);
        break;
      case 'flag':
        expect(isFlagEmoji(value)).toBe(true);
        break;
      case 'keycap':
        expect(isKeycapEmoji(value)).toBe(true);
        break;
      case 'any':
      default:
        expect(isAnyEmoji(value)).toBe(true);
        break;
    }
  };

  const emojiBuilder = (extra: Extra) => emoji(extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(emojiBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(emojiBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(emojiBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(emojiBuilder, { extraParameters });
  });
});
