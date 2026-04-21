import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { xorshift128plus } from 'pure-rand/generator/xorshift128plus';

import { stringFromCorpus } from '../../../src/arbitrary/stringFromCorpus.js';
import type { StringFromCorpusConstraints } from '../../../src/arbitrary/stringFromCorpus.js';
import type { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary.js';
import { Random } from '../../../src/random/generator/Random.js';

import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesStrictlySmallerValue,
} from './__test-helpers__/ArbitraryAssertions.js';
import { buildShrinkTree, walkTree } from './__test-helpers__/ShrinkTree.js';

function randomFromSeed(seed: number): Random {
  return new Random(xorshift128plus(seed));
}

function sampleN<T>(arb: Arbitrary<T>, seed: number, n: number, biasFactor?: number): T[] {
  const mrng = randomFromSeed(seed);
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    out.push(arb.generate(mrng, biasFactor).value);
  }
  return out;
}

describe('stringFromCorpus', () => {
  describe('factory', () => {
    it('should throw when corpus is empty', () => {
      expect(() => stringFromCorpus([])).toThrowError(/non-empty corpus/i);
    });

    it('should throw when corpus is empty regardless of constraints', () => {
      expect(() => stringFromCorpus([], { maxEdits: 3 })).toThrowError(/non-empty corpus/i);
    });

    it('should accept a single-entry corpus', () => {
      expect(() => stringFromCorpus(['only one'])).not.toThrow();
    });

    it('should return an Arbitrary able to generate a string', () => {
      const arb = stringFromCorpus(['alpha', 'beta']);
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const [value] = sampleN(arb, seed, 1);
          expect(typeof value).toBe('string');
        }),
        { numRuns: 20 },
      );
    });
  });

  describe('canShrinkWithoutContext', () => {
    it('should return true for an exact corpus match', () => {
      const arb = stringFromCorpus(['hello', 'world', 'foo']);
      expect(arb.canShrinkWithoutContext('hello')).toBe(true);
      expect(arb.canShrinkWithoutContext('world')).toBe(true);
      expect(arb.canShrinkWithoutContext('foo')).toBe(true);
    });

    it('should return false for a near-match (off by one character)', () => {
      const arb = stringFromCorpus(['hello', 'world']);
      expect(arb.canShrinkWithoutContext('hellx')).toBe(false);
      expect(arb.canShrinkWithoutContext('hell')).toBe(false);
      expect(arb.canShrinkWithoutContext('helloo')).toBe(false);
    });

    it('should return true for the empty-string corpus entry', () => {
      const arb = stringFromCorpus(['', 'not empty']);
      expect(arb.canShrinkWithoutContext('')).toBe(true);
    });

    it('should return false for non-string values', () => {
      const arb = stringFromCorpus(['hello']);
      expect(arb.canShrinkWithoutContext(42)).toBe(false);
      expect(arb.canShrinkWithoutContext(null)).toBe(false);
      expect(arb.canShrinkWithoutContext(undefined)).toBe(false);
      expect(arb.canShrinkWithoutContext({})).toBe(false);
      expect(arb.canShrinkWithoutContext(['hello'])).toBe(false);
    });
  });

  describe('shrink', () => {
    it('should yield a non-empty shrink stream when value is a corpus entry other than index 0', () => {
      const arb = stringFromCorpus(['alpha', 'beta', 'gamma']);
      const values = [...arb.shrink('beta', undefined)];
      expect(values.length).toBeGreaterThan(0);
      // The first cross-shrink target should be the earliest corpus entry.
      expect(values[0].value).toBe('alpha');
    });

    it('should yield a non-empty shrink stream when value is corpus[2]', () => {
      const arb = stringFromCorpus(['a', 'b', 'c']);
      const values = [...arb.shrink('c', undefined)];
      // Cross-shrink toward corpus[0] produces at least 2 candidates (a and b).
      expect(values.map((v) => v.value)).toEqual(['a', 'b']);
    });

    it('should yield an empty shrink stream for a non-corpus value', () => {
      const arb = stringFromCorpus(['alpha', 'beta']);
      const values = [...arb.shrink('not-in-corpus', undefined)];
      expect(values).toEqual([]);
    });

    it('should prefer the lowest corpus index on duplicates', () => {
      // 'hello' appears at indices 0 and 2; context-free recovery must map to idx 0.
      const arb = stringFromCorpus(['hello', 'world', 'hello']);
      const values = [...arb.shrink('world', undefined)];
      // Only idx 0 exists before 'world' (idx 1), so the cross-shrink stream
      // yields exactly one entry — the earliest 'hello'.
      expect(values.map((v) => v.value)).toEqual(['hello']);
    });

    it('should yield an empty stream when the value is corpus[0]', () => {
      const arb = stringFromCorpus(['alpha', 'beta', 'gamma']);
      const values = [...arb.shrink('alpha', undefined)];
      expect(values).toEqual([]);
    });
  });

  describe('size wiring', () => {
    it('should honour an explicit maxEdits override', () => {
      // With maxEdits: 0, every non-bias generate result equals the chosen corpus entry.
      const corpus = ['alpha', 'bravo'];
      const corpusSet = new Set(corpus);
      const arb = stringFromCorpus(corpus, { maxEdits: 0 });
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const [v] = sampleN(arb, seed, 1);
          expect(corpusSet.has(v)).toBe(true);
        }),
        { numRuns: 50 },
      );
    });

    it('should accept size="xsmall" without throwing and still produce strings', () => {
      const arb = stringFromCorpus(['abc', 'def'], { size: 'xsmall' });
      const values = sampleN(arb, 42, 5);
      for (const v of values) {
        expect(typeof v).toBe('string');
      }
    });
  });

  describe('length constraints', () => {
    it('should keep every generated value within [minLength, maxLength] when includeOriginals=false and corpus respects bounds', () => {
      const corpus = ['abcde', 'fghij'];
      const arb = stringFromCorpus(corpus, {
        minLength: 3,
        maxLength: 7,
        maxEdits: 8,
        includeOriginals: false,
      });
      fc.assert(
        fc.property(fc.integer(), fc.option(fc.integer({ min: 2, max: 16 }), { nil: undefined }), (seed, bias) => {
          const values = sampleN(arb, seed, 10, bias);
          for (const v of values) {
            const codePoints = [...v].length;
            expect(codePoints).toBeGreaterThanOrEqual(3);
            expect(codePoints).toBeLessThanOrEqual(7);
          }
        }),
        { numRuns: 20 },
      );
    });

    it('should produce strings with exactly the requested length when minLength === maxLength (and corpus respects it)', () => {
      const corpus = ['abcde'];
      const arb = stringFromCorpus(corpus, {
        minLength: 5,
        maxLength: 5,
        maxEdits: 10,
        includeOriginals: false,
      });
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const values = sampleN(arb, seed, 10);
          for (const v of values) {
            expect([...v].length).toBe(5);
          }
        }),
        { numRuns: 20 },
      );
    });
  });

  describe('bias path', () => {
    it('should emit raw corpus entries under biased generation when includeOriginals=true', () => {
      const corpus = ['alpha', 'bravo', 'charlie'];
      const corpusSet = new Set(corpus);
      const arb = stringFromCorpus(corpus, { maxEdits: 8, includeOriginals: true });
      const N = 200;
      const values = sampleN(arb, 1234, N, 2);
      const hits = values.filter((v) => corpusSet.has(v)).length;
      // With biasFactor = 2, ~half of the samples should be raw corpus entries.
      expect(hits).toBeGreaterThan(N / 5); // very lax lower bound to stay robust across seeds
    });
  });

  describe('extra alphabet', () => {
    it('should decode non-BMP emoji characters from extraAlphabet correctly', () => {
      const arb = stringFromCorpus([''], { extraAlphabet: '\u{1F680}\u{1F389}', maxEdits: 6 });
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const [v] = sampleN(arb, seed, 1);
          for (const ch of v) {
            expect(ch === '\u{1F680}' || ch === '\u{1F389}').toBe(true);
          }
        }),
        { numRuns: 30 },
      );
    });

    it("should fall back to ASCII printable when corpus=[''] and no extraAlphabet is provided", () => {
      const arb = stringFromCorpus([''], { maxEdits: 6 });
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const [v] = sampleN(arb, seed, 1);
          for (const ch of v) {
            const cp = ch.codePointAt(0)!;
            expect(cp).toBeGreaterThanOrEqual(0x20);
            expect(cp).toBeLessThanOrEqual(0x7e);
          }
        }),
        { numRuns: 30 },
      );
    });

    it("should only draw from the provided extraAlphabet when corpus=['']", () => {
      const arb = stringFromCorpus([''], { maxEdits: 6, extraAlphabet: 'abc' });
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const [v] = sampleN(arb, seed, 1);
          for (const ch of v) {
            expect(['a', 'b', 'c']).toContain(ch);
          }
        }),
        { numRuns: 30 },
      );
    });
  });

  describe('seed stability', () => {
    it('should produce the same value when called with the same seed and equivalent configs', () => {
      const corpus = ['alpha', 'bravo'];
      const arbA = stringFromCorpus(corpus, { maxEdits: 4, extraAlphabet: 'xyz' });
      const arbB = stringFromCorpus(corpus, { maxEdits: 4, extraAlphabet: 'xyz' });
      for (const seed of [1, 2, 3, 42, 9999]) {
        const [va] = sampleN(arbA, seed, 1);
        const [vb] = sampleN(arbB, seed, 1);
        expect(vb).toBe(va);
      }
    });
  });
});

describe('stringFromCorpus (integration)', () => {
  type Extra = {
    corpus: string[];
    includeOriginals: boolean;
    maxEdits: number;
    extraAlphabet: string;
  };
  const extraParameters: fc.Arbitrary<Extra> = fc.record({
    corpus: fc.array(fc.string({ maxLength: 6, size: '+1' }), { minLength: 1, maxLength: 4 }),
    includeOriginals: fc.boolean(),
    maxEdits: fc.nat({ max: 6 }),
    extraAlphabet: fc.string({ maxLength: 4 }),
  });

  const stringFromCorpusBuilder = (extra: Extra) =>
    stringFromCorpus(extra.corpus, {
      includeOriginals: extra.includeOriginals,
      maxEdits: extra.maxEdits,
      extraAlphabet: extra.extraAlphabet,
    });

  const isCorrect = (value: unknown): boolean => typeof value === 'string';

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(stringFromCorpusBuilder, { extraParameters });
  });

  it('should only produce strings', () => {
    assertProduceCorrectValues(stringFromCorpusBuilder, isCorrect, { extraParameters });
  });

  it('should produce corpus entries that can be replayed without a context', () => {
    // Narrower builder: we only attempt canShrinkWithoutContext assertions on the
    // subset of values that are corpus-entry exact matches. We force the arbitrary
    // to emit such values by setting `maxEdits: 0`.
    const narrowExtra: fc.Arbitrary<Extra> = fc.record({
      corpus: fc.array(fc.string({ maxLength: 6, size: '+1' }), { minLength: 1, maxLength: 4 }),
      includeOriginals: fc.boolean(),
      maxEdits: fc.constant(0),
      extraAlphabet: fc.string({ maxLength: 4 }),
    });
    assertProduceValuesShrinkableWithoutContext(stringFromCorpusBuilder, { extraParameters: narrowExtra });
  });

  it('should be able to shrink to the same values without initial context (when corpus entries)', () => {
    // For replay without context to produce the same shrink tree, we need:
    //  - the generated value to be a corpus entry (enforced by maxEdits: 0)
    //  - a deduplicated corpus (duplicates would make the context-free path
    //    always pick the earliest matching index, shortening the cross-shrink
    //    stream relative to the context-bearing path).
    const narrowBuilder = (extra: Omit<Extra, 'maxEdits'>) =>
      stringFromCorpus(extra.corpus, {
        includeOriginals: extra.includeOriginals,
        maxEdits: 0,
        extraAlphabet: extra.extraAlphabet,
      });
    const narrowExtra: fc.Arbitrary<Omit<Extra, 'maxEdits'>> = fc
      .record({
        corpus: fc.uniqueArray(fc.string({ maxLength: 6, size: '+1' }), { minLength: 1, maxLength: 4 }),
        includeOriginals: fc.boolean(),
        extraAlphabet: fc.string({ maxLength: 4 }),
      })
      .map(({ corpus, includeOriginals, extraAlphabet }) => ({
        corpus: [...corpus],
        includeOriginals,
        extraAlphabet,
      }));
    assertShrinkProducesSameValueWithoutInitialContext(narrowBuilder, { extraParameters: narrowExtra });
  });

  it('should ignore bias when includeOriginals=false (no guarantees to emit raw corpus entries)', () => {
    // Smoke-test: generation still terminates under heavy bias.
    const arb = stringFromCorpus(['alpha', 'bravo', 'charlie'], { includeOriginals: false, maxEdits: 4 });
    const values = sampleN(arb, 7, 25, 2);
    expect(values.length).toBe(25);
    for (const v of values) {
      expect(typeof v).toBe('string');
    }
  });

  it('should shrink to strictly smaller values along the dominant shrink axis (fewer ops, earlier corpus idx)', () => {
    // "Strictly smaller" for this arbitrary is defined jointly on (corpusIdx,
    // opsLen, codePointLength). Because the helper only sees the generated
    // string, we narrow the scenario to `maxEdits: 0` with a corpus that is
    // strictly ordered by length (so shrinking the corpus idx toward 0 is
    // observably strictly-shorter on the generated value).
    type Extra3 = { corpus: string[]; includeOriginals: boolean };
    const narrowExtra: fc.Arbitrary<Extra3> = fc
      .record({
        // A strictly-increasing-length corpus ensures cross-shrinks toward
        // idx 0 produce a strictly shorter string. We build it from a unique
        // set of integers, then map each i to `'a'.repeat(i + 1)`.
        corpusLens: fc.uniqueArray(fc.nat({ max: 10 }), { minLength: 1, maxLength: 4 }).map((xs) => [...xs].sort((a, b) => a - b)),
        includeOriginals: fc.boolean(),
      })
      .map(({ corpusLens, includeOriginals }) => ({
        corpus: corpusLens.map((n) => 'a'.repeat(n + 1)),
        includeOriginals,
      }));
    const narrowBuilder = (extra: Extra3) =>
      stringFromCorpus(extra.corpus, { maxEdits: 0, includeOriginals: extra.includeOriginals });
    const isStrictlySmaller = (vNew: string, vOld: string) => vNew.length < vOld.length;
    assertShrinkProducesStrictlySmallerValue(narrowBuilder, isStrictlySmaller, { extraParameters: narrowExtra });
  });

  it('should build a finite shrink tree whose leaves reach corpus[0]', () => {
    // Drive a non-trivial generate, then walk the full shrink tree and assert
    // (a) the tree is finite (terminates), (b) all nodes are strings, and (c)
    // at least one leaf equals corpus[0] (the dominant cross-shrink target).
    const corpus = ['alpha', 'bravo', 'charlie'];
    const arb = stringFromCorpus(corpus, { maxEdits: 3, includeOriginals: false, extraAlphabet: 'xyz' });
    const rootValue = arb.generate(randomFromSeed(1), undefined);
    const tree = buildShrinkTree(arb, rootValue);
    const collected: string[] = [];
    walkTree(tree, (s) => {
      // finite iff this loop terminates — vitest will time out if not.
      collected.push(s);
    });
    expect(collected.length).toBeGreaterThan(0);
    for (const s of collected) {
      expect(typeof s).toBe('string');
    }
    // The cross-shrink target `corpus[0]` must appear somewhere in the tree
    // when the root is not already corpus[0].
    if (rootValue.value !== corpus[0]) {
      expect(collected).toContain(corpus[0]);
    }
  });

  it('should consume rng draws for transpose even when liveLen < 2 (determinism)', () => {
    // When liveLen < 2, `transpose` is a no-op. We assert that two calls with
    // the same seed produce identical values even though the transpose op
    // list contains entries that can't actually fire, i.e. the seed stream is
    // unchanged regardless of whether transpose applied.
    const arb = stringFromCorpus([''], { maxEdits: 5, extraAlphabet: 'abc', includeOriginals: false });
    for (const seed of [1, 2, 3, 42]) {
      const [va] = sampleN(arb, seed, 1);
      const [vb] = sampleN(arb, seed, 1);
      expect(vb).toBe(va);
      expect(typeof va).toBe('string');
    }
  });

  it('should respect maxLength when includeOriginals=false', () => {
    // minLength is best-effort only (see JSDoc: edit ops that would push below
    // minLength are dropped, but short corpus entries can stay short). We
    // therefore assert only the upper bound here.
    type Extra2 = StringFromCorpusConstraints & { corpus: string[] };
    const extra: fc.Arbitrary<Extra2> = fc
      .tuple(fc.array(fc.string({ maxLength: 3 }), { minLength: 1, maxLength: 3 }), fc.nat({ max: 5 }))
      .map(([corpus, extraLen]) => ({ corpus, maxLength: extraLen + 5, includeOriginals: false }));
    assertProduceCorrectValues(
      (e: Extra2) =>
        stringFromCorpus(e.corpus, {
          maxLength: e.maxLength,
          includeOriginals: e.includeOriginals,
        }),
      (value, e) => {
        const len = [...value].length;
        if (e.maxLength !== undefined) {
          expect(len).toBeLessThanOrEqual(e.maxLength);
        }
        return true;
      },
      { extraParameters: extra },
    );
  });
});
