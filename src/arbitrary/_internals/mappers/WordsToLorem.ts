/** @internal */
export function wordsToJoinedStringMapper(words: string[]): string {
  // Strip any coma
  return words.map((w) => (w[w.length - 1] === ',' ? w.substr(0, w.length - 1) : w)).join(' ');
}

/** @internal */
export function wordsToSentenceMapper(words: string[]): string {
  // Strip trailing coma (only)
  let sentence = words.join(' ');
  if (sentence[sentence.length - 1] === ',') {
    sentence = sentence.substr(0, sentence.length - 1);
  }
  return sentence[0].toUpperCase() + sentence.substring(1) + '.';
}

/** @internal */
export function sentencesToParagraphMapper(sentences: string[]): string {
  // Sentences are supposed to always end by a '.' and not contain any other '.'
  return sentences.join(' ');
}
