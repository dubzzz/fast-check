import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import {
  safeJoin,
  safeMap,
  safePush,
  safeSplit,
  safeSubstring,
  safeToLowerCase,
  safeToUpperCase,
} from '../../../utils/globals.js';

/** @internal */
export function wordsToJoinedStringMapper(words: string[]): string {
  // Strip any comma
  return safeJoin(
    safeMap(words, (w) => (w[w.length - 1] === ',' ? safeSubstring(w, 0, w.length - 1) : w)),
    ' ',
  );
}

/** @internal */
export function wordsToJoinedStringUnmapperFor(wordsArbitrary: Arbitrary<string>): (value: unknown) => string[] {
  return function wordsToJoinedStringUnmapper(value: unknown): string[] {
    const v = value as string;
    const words: string[] = [];
    for (const candidate of safeSplit(v, ' ')) {
      if (wordsArbitrary.canShrinkWithoutContext(candidate)) safePush(words, candidate);
      else if (wordsArbitrary.canShrinkWithoutContext(candidate + ',')) safePush(words, candidate + ',');
      else throw new Error('Unsupported word');
    }
    return words;
  };
}

/** @internal */
export function wordsToSentenceMapper(words: string[]): string {
  // Strip trailing comma (only)
  let sentence = safeJoin(words, ' ');
  if (sentence[sentence.length - 1] === ',') {
    sentence = safeSubstring(sentence, 0, sentence.length - 1);
  }
  return safeToUpperCase(sentence[0]) + safeSubstring(sentence, 1) + '.';
}

/** @internal */
export function wordsToSentenceUnmapperFor(wordsArbitrary: Arbitrary<string>): (value: unknown) => string[] {
  return function wordsToSentenceUnmapper(value: unknown): string[] {
    const v = value as string;
    if (
      v.length < 2 ||
      v[v.length - 1] !== '.' ||
      v[v.length - 2] === ',' ||
      safeToUpperCase(safeToLowerCase(v[0])) !== v[0]
    ) {
      throw new Error('Unsupported value');
    }
    const adaptedValue = safeToLowerCase(v[0]) + safeSubstring(v, 1, v.length - 1);
    const words: string[] = [];
    const candidates = safeSplit(adaptedValue, ' ');
    for (let idx = 0; idx !== candidates.length; ++idx) {
      const candidate = candidates[idx];
      if (wordsArbitrary.canShrinkWithoutContext(candidate)) safePush(words, candidate);
      else if (idx === candidates.length - 1 && wordsArbitrary.canShrinkWithoutContext(candidate + ','))
        safePush(words, candidate + ',');
      else throw new Error('Unsupported word');
    }
    return words;
  };
}

/** @internal */
export function sentencesToParagraphMapper(sentences: string[]): string {
  // Sentences are supposed to always end by a '.' and not contain any other '.'
  return safeJoin(sentences, ' ');
}

/** @internal */
export function sentencesToParagraphUnmapper(value: unknown): string[] {
  const v = value as string;
  const sentences = safeSplit(v, '. ');
  for (let idx = 0; idx < sentences.length - 1; ++idx) {
    sentences[idx] += '.'; // re-add removed '.'
  }
  return sentences;
}
