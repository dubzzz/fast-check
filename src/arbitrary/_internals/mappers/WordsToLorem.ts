import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';

/** @internal */
export function wordsToJoinedStringMapper(words: string[]): string {
  // Strip any comma
  return words.map((w) => (w[w.length - 1] === ',' ? w.substr(0, w.length - 1) : w)).join(' ');
}

/** @internal */
export function wordsToJoinedStringUnmapperFor(wordsArbitrary: Arbitrary<string>): (value: unknown) => string[] {
  return function wordsToJoinedStringUnmapper(value: unknown): string[] {
    if (typeof value !== 'string') {
      throw new Error('Unsupported type');
    }
    const words: string[] = [];
    for (const candidate of value.split(' ')) {
      if (wordsArbitrary.canShrinkWithoutContext(candidate)) words.push(candidate);
      else if (wordsArbitrary.canShrinkWithoutContext(candidate + ',')) words.push(candidate + ',');
      else throw new Error('Unsupported word');
    }
    return words;
  };
}

/** @internal */
export function wordsToSentenceMapper(words: string[]): string {
  // Strip trailing comma (only)
  let sentence = words.join(' ');
  if (sentence[sentence.length - 1] === ',') {
    sentence = sentence.substr(0, sentence.length - 1);
  }
  return sentence[0].toUpperCase() + sentence.substring(1) + '.';
}

/** @internal */
export function wordsToSentenceUnmapperFor(wordsArbitrary: Arbitrary<string>): (value: unknown) => string[] {
  return function wordsToSentenceUnmapper(value: unknown): string[] {
    if (typeof value !== 'string') {
      throw new Error('Unsupported type');
    }
    if (
      value.length < 2 ||
      value[value.length - 1] !== '.' ||
      value[value.length - 2] === ',' ||
      value[0].toLowerCase().toUpperCase() !== value[0]
    ) {
      throw new Error('Unsupported value');
    }
    const adaptedValue = value[0].toLowerCase() + value.substring(1, value.length - 1);
    const words: string[] = [];
    const candidates = adaptedValue.split(' ');
    for (let idx = 0; idx !== candidates.length; ++idx) {
      const candidate = candidates[idx];
      if (wordsArbitrary.canShrinkWithoutContext(candidate)) words.push(candidate);
      else if (idx === candidates.length - 1 && wordsArbitrary.canShrinkWithoutContext(candidate + ','))
        words.push(candidate + ',');
      else throw new Error('Unsupported word');
    }
    return words;
  };
}

/** @internal */
export function sentencesToParagraphMapper(sentences: string[]): string {
  // Sentences are supposed to always end by a '.' and not contain any other '.'
  return sentences.join(' ');
}

/** @internal */
export function sentencesToParagraphUnmapper(value: unknown): string[] {
  if (typeof value !== 'string') {
    throw new Error('Unsupported type');
  }
  const sentences = value.split('. ');
  for (let idx = 0; idx < sentences.length - 1; ++idx) {
    sentences[idx] += '.'; // re-add removed '.'
  }
  return sentences;
}
