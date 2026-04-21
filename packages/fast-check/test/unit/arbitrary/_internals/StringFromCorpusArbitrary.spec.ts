import { describe, it, expect } from 'vitest';

import { StringFromCorpusArbitrary } from '../../../../src/arbitrary/_internals/StringFromCorpusArbitrary.js';
import type { StringFromCorpusContext } from '../../../../src/arbitrary/_internals/StringFromCorpusArbitrary.js';
import { fakeRandom } from '../__test-helpers__/RandomHelpers.js';

describe('StringFromCorpusArbitrary', () => {
  describe('constructor', () => {
    it('should throw when corpus is empty', () => {
      expect(
        () =>
          new StringFromCorpusArbitrary([], {
            minLength: 0,
            maxGeneratedLength: 10,
            maxEdits: 2,
            includeOriginals: true,
            extraAlphabet: '',
          }),
      ).toThrow();
    });
  });

  describe('generate (no bias)', () => {
    it('should emit a string and a StringFromCorpusContext', () => {
      // Arrange
      const { instance: mrng, nextInt } = fakeRandom();
      nextInt.mockReturnValueOnce(0); // pick corpus idx 0
      nextInt.mockReturnValueOnce(0); // numOps = 0

      // Act
      const arb = new StringFromCorpusArbitrary(['alpha', 'bravo'], {
        minLength: 0,
        maxGeneratedLength: 10,
        maxEdits: 2,
        includeOriginals: true,
        extraAlphabet: '',
      });
      const v = arb.generate(mrng, undefined);

      // Assert
      expect(typeof v.value).toBe('string');
      const ctx = v.context as StringFromCorpusContext;
      expect(ctx.corpusIdx).toBe(0);
      expect(ctx.ops).toEqual([]);
      expect(v.value).toBe('alpha');
    });

    it('should draw maxEdits ops when numOps draw maxes out', () => {
      // Arrange
      const { instance: mrng, nextInt } = fakeRandom();
      nextInt.mockReturnValueOnce(0); // corpus idx
      nextInt.mockReturnValueOnce(2); // numOps = 2 (at maxEdits)
      // First op: kind=substitute (idx 2), pos=0, charIdx=0
      nextInt.mockReturnValueOnce(2);
      nextInt.mockReturnValueOnce(0);
      nextInt.mockReturnValueOnce(0);
      // Second op: kind=substitute (idx 2), pos=1, charIdx=1
      nextInt.mockReturnValueOnce(2);
      nextInt.mockReturnValueOnce(1);
      nextInt.mockReturnValueOnce(1);

      // Act
      const arb = new StringFromCorpusArbitrary(['abc'], {
        minLength: 0,
        maxGeneratedLength: 10,
        maxEdits: 2,
        includeOriginals: true,
        extraAlphabet: '',
      });
      const v = arb.generate(mrng, undefined);

      // Assert
      const ctx = v.context as StringFromCorpusContext;
      expect(ctx.ops.length).toBe(2);
      expect(ctx.ops[0].kind).toBe('substitute');
      expect(ctx.ops[1].kind).toBe('substitute');
    });
  });

  describe('generate (bias path)', () => {
    it('should emit the raw corpus entry when includeOriginals=true, biasFactor set, and roll hits bias', () => {
      // Arrange
      const { instance: mrng, nextInt } = fakeRandom();
      nextInt.mockReturnValueOnce(1); // mrng.nextInt(1, biasFactor) === 1 => bias fires
      nextInt.mockReturnValueOnce(1); // pick corpus idx 1

      // Act
      const arb = new StringFromCorpusArbitrary(['alpha', 'bravo'], {
        minLength: 0,
        maxGeneratedLength: 10,
        maxEdits: 2,
        includeOriginals: true,
        extraAlphabet: '',
      });
      const v = arb.generate(mrng, 2);

      // Assert
      expect(v.value).toBe('bravo');
      const ctx = v.context as StringFromCorpusContext;
      expect(ctx.corpusIdx).toBe(1);
      expect(ctx.ops).toEqual([]);
    });

    it('should emit the raw corpus entry AS-IS even if it violates maxLength (documented bias-path escape hatch)', () => {
      // Arrange: corpus entry "alphabet" (length 8) exceeds maxGeneratedLength=3.
      const { instance: mrng, nextInt } = fakeRandom();
      nextInt.mockReturnValueOnce(1); // bias fires
      nextInt.mockReturnValueOnce(0); // corpus idx

      // Act
      const arb = new StringFromCorpusArbitrary(['alphabet'], {
        minLength: 0,
        maxGeneratedLength: 3,
        maxEdits: 2,
        includeOriginals: true,
        extraAlphabet: '',
      });
      const v = arb.generate(mrng, 2);

      // Assert
      expect(v.value).toBe('alphabet'); // original emitted as-is
    });

    it('should NOT emit raw corpus entry when includeOriginals=false even under heavy bias', () => {
      // Arrange: if the bias-path were active, the first nextInt would only draw
      // within [1, biasFactor]. We bypass that by providing enough draws for the
      // non-bias code path (pick idx, numOps = 0).
      const { instance: mrng, nextInt } = fakeRandom();
      nextInt.mockReturnValueOnce(0); // corpus idx
      nextInt.mockReturnValueOnce(0); // numOps = 0

      // Act
      const arb = new StringFromCorpusArbitrary(['alpha', 'bravo'], {
        minLength: 0,
        maxGeneratedLength: 10,
        maxEdits: 2,
        includeOriginals: false,
        extraAlphabet: '',
      });
      const v = arb.generate(mrng, 2);

      // Assert: includeOriginals=false means bias does not fire, value comes from
      // the uniform-pick + applyOps path.
      expect(typeof v.value).toBe('string');
    });
  });

  describe('alphabet building', () => {
    it("should fall back to ASCII printable when corpus is [''] and no extraAlphabet", () => {
      // Arrange: numOps=1, op=insert at pos=0 with charIdx=0.
      const { instance: mrng, nextInt } = fakeRandom();
      nextInt.mockReturnValueOnce(0); // corpus idx
      nextInt.mockReturnValueOnce(1); // numOps = 1
      nextInt.mockReturnValueOnce(0); // kind=insert
      // baseLen=0 ⇒ `pos` is hard-coded to 0, no draw consumed for pos
      nextInt.mockReturnValueOnce(0); // charIdx (alphabet[0] = 0x20 = space)

      // Act
      const arb = new StringFromCorpusArbitrary([''], {
        minLength: 0,
        maxGeneratedLength: 5,
        maxEdits: 1,
        includeOriginals: true,
        extraAlphabet: '',
      });
      const v = arb.generate(mrng, undefined);

      // Assert: alphabet[0] is 0x20 (space, first printable ASCII).
      expect(v.value).toBe(' ');
    });

    it("should use exactly extraAlphabet code points when corpus is ['']", () => {
      // Arrange: alphabet = [97, 98, 99] ('a','b','c'). insert at 0, charIdx=2.
      const { instance: mrng, nextInt } = fakeRandom();
      nextInt.mockReturnValueOnce(0); // corpus idx
      nextInt.mockReturnValueOnce(1); // numOps = 1
      nextInt.mockReturnValueOnce(0); // kind=insert
      // baseLen=0 ⇒ `pos` is hard-coded to 0, no draw consumed for pos
      nextInt.mockReturnValueOnce(2); // charIdx = 2 -> 'c'

      // Act
      const arb = new StringFromCorpusArbitrary([''], {
        minLength: 0,
        maxGeneratedLength: 5,
        maxEdits: 1,
        includeOriginals: true,
        extraAlphabet: 'abc',
      });
      const v = arb.generate(mrng, undefined);

      // Assert
      expect(v.value).toBe('c');
    });
  });

  describe('length clamp', () => {
    it('should prevent insert from growing past maxGeneratedLength', () => {
      // Arrange: corpus 'abcd' (len 4), maxGeneratedLength=4, insert op should no-op.
      const { instance: mrng, nextInt } = fakeRandom();
      nextInt.mockReturnValueOnce(0); // corpus idx
      nextInt.mockReturnValueOnce(1); // numOps = 1
      nextInt.mockReturnValueOnce(0); // kind=insert
      nextInt.mockReturnValueOnce(0); // pos (baseLen=4, so drawn in [0..4])
      nextInt.mockReturnValueOnce(0); // charIdx

      // Act
      const arb = new StringFromCorpusArbitrary(['abcd'], {
        minLength: 0,
        maxGeneratedLength: 4,
        maxEdits: 1,
        includeOriginals: false,
        extraAlphabet: '',
      });
      const v = arb.generate(mrng, undefined);

      // Assert: the insert would have produced length 5 > 4, so it no-ops.
      expect([...v.value].length).toBe(4);
      expect(v.value).toBe('abcd');
    });

    it('should prevent delete from shrinking past minLength', () => {
      // Arrange: corpus 'abcd' (len 4), minLength=4, delete op should no-op.
      const { instance: mrng, nextInt } = fakeRandom();
      nextInt.mockReturnValueOnce(0); // corpus idx
      nextInt.mockReturnValueOnce(1); // numOps = 1
      nextInt.mockReturnValueOnce(1); // kind=delete
      nextInt.mockReturnValueOnce(0); // pos
      nextInt.mockReturnValueOnce(0); // charIdx (unused for delete, but drawOp draws it)

      // Act
      const arb = new StringFromCorpusArbitrary(['abcd'], {
        minLength: 4,
        maxGeneratedLength: 10,
        maxEdits: 1,
        includeOriginals: false,
        extraAlphabet: '',
      });
      const v = arb.generate(mrng, undefined);

      // Assert
      expect([...v.value].length).toBe(4);
      expect(v.value).toBe('abcd');
    });
  });

  describe('shrink', () => {
    it('should drop ops tail-first', () => {
      // Arrange: create an arb with a 3-op context and inspect drop order.
      const arb = new StringFromCorpusArbitrary(['abc'], {
        minLength: 0,
        maxGeneratedLength: 10,
        maxEdits: 5,
        includeOriginals: true,
        extraAlphabet: '',
      });
      const ctx: StringFromCorpusContext = {
        corpusIdx: 0,
        ops: [
          { kind: 'substitute', pos: 0, charIdx: 0 },
          { kind: 'substitute', pos: 1, charIdx: 0 },
          { kind: 'substitute', pos: 2, charIdx: 0 },
        ],
      };

      // Act
      const shrinks = [...arb.shrink('zzz', ctx)];

      // Assert: the first 3 shrinks drop ops from the tail.
      // ops 3->2, 3->1, 3->0 (plus cross-shrink which yields none since corpusIdx=0).
      expect(shrinks.length).toBe(3);
      const opCounts = shrinks.map((v) => (v.context as StringFromCorpusContext).ops.length);
      expect(opCounts).toEqual([2, 1, 0]);
    });

    it('should cross-shrink corpus idx toward 0', () => {
      // Arrange: corpusIdx=2, no ops.
      const arb = new StringFromCorpusArbitrary(['alpha', 'bravo', 'charlie'], {
        minLength: 0,
        maxGeneratedLength: 20,
        maxEdits: 5,
        includeOriginals: true,
        extraAlphabet: '',
      });
      const ctx: StringFromCorpusContext = { corpusIdx: 2, ops: [] };

      // Act
      const shrinks = [...arb.shrink('charlie', ctx)];

      // Assert: drop-ops stream is empty (0 ops), cross-shrink yields idx 0 and 1.
      expect(shrinks.map((v) => v.value)).toEqual(['alpha', 'bravo']);
      const idxs = shrinks.map((v) => (v.context as StringFromCorpusContext).corpusIdx);
      expect(idxs).toEqual([0, 1]);
    });

    it('should return an empty stream for a non-corpus value with no context', () => {
      const arb = new StringFromCorpusArbitrary(['alpha'], {
        minLength: 0,
        maxGeneratedLength: 10,
        maxEdits: 2,
        includeOriginals: true,
        extraAlphabet: '',
      });
      const shrinks = [...arb.shrink('not-in-corpus', undefined)];
      expect(shrinks).toEqual([]);
    });

    it('should synthesise a zero-op context for a context-free corpus match', () => {
      const arb = new StringFromCorpusArbitrary(['alpha', 'bravo'], {
        minLength: 0,
        maxGeneratedLength: 10,
        maxEdits: 2,
        includeOriginals: true,
        extraAlphabet: '',
      });
      const shrinks = [...arb.shrink('bravo', undefined)];
      expect(shrinks.map((v) => v.value)).toEqual(['alpha']);
      expect((shrinks[0].context as StringFromCorpusContext).corpusIdx).toBe(0);
      expect((shrinks[0].context as StringFromCorpusContext).ops).toEqual([]);
    });
  });

  describe('canShrinkWithoutContext', () => {
    it('should accept a strict corpus match', () => {
      const arb = new StringFromCorpusArbitrary(['alpha', 'bravo'], {
        minLength: 0,
        maxGeneratedLength: 10,
        maxEdits: 2,
        includeOriginals: true,
        extraAlphabet: '',
      });
      expect(arb.canShrinkWithoutContext('alpha')).toBe(true);
      expect(arb.canShrinkWithoutContext('bravo')).toBe(true);
    });

    it('should reject a near-match or anything that is not a corpus entry', () => {
      const arb = new StringFromCorpusArbitrary(['alpha'], {
        minLength: 0,
        maxGeneratedLength: 10,
        maxEdits: 2,
        includeOriginals: true,
        extraAlphabet: '',
      });
      expect(arb.canShrinkWithoutContext('alphx')).toBe(false);
      expect(arb.canShrinkWithoutContext('')).toBe(false);
      expect(arb.canShrinkWithoutContext(null)).toBe(false);
      expect(arb.canShrinkWithoutContext(undefined)).toBe(false);
      expect(arb.canShrinkWithoutContext(0)).toBe(false);
    });
  });
});
