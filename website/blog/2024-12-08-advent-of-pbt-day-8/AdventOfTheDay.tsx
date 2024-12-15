import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 8,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: respace,
  parser,
  placeholderForm: 'messagewithoutanyspace\nmessage\nspace\nnothing\nempty\nwithout\nany',
  functionName: 'respace',
  signature: 'respace(spacelessMessage: string, words: string[]): string;',
  signatureExtras: [],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

function respace(spacelessMessage: string, words: string[]): string {
  const match = respaceInternal(spacelessMessage, words, 0);
  if (match === undefined) {
    return spacelessMessage;
  }
  return match.join(' ');
}

function respaceInternal(spacelessMessage: string, words: string[], startIndex: number): string[] | undefined {
  if (startIndex === spacelessMessage.length) {
    return [];
  }
  for (const word of words) {
    if (spacelessMessage.startsWith(word, startIndex)) {
      const subMatch = respaceInternal(spacelessMessage, words, startIndex + word.length);
      if (subMatch !== undefined) {
        return [word, ...subMatch];
      }
    }
  }
  return undefined;
}

// Inputs parser

const validMessageOrWord = /^[a-z]+$/;
function parser(answer: string): unknown[] | undefined {
  const lines = answer.split('\n');
  if (lines.length < 1) {
    throw new Error(`Your answer should be made of at least one line`);
  }
  if (lines.some((line) => !validMessageOrWord.test(line))) {
    throw new Error(`The message and the words possibly making it should only be made of characters in a-z`);
  }
  return [lines[0], lines.slice(1)];
}
