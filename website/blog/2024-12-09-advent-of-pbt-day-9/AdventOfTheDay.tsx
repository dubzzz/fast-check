import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 9,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: isProbablyEnchantedWord,
  parser,
  placeholderForm: 'any set of characters as long as it fits on one line',
  functionName: 'isProbablyEnchantedWord',
  signature: 'isProbablyEnchantedWord(word: string): string;',
  signatureExtras: [],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

function isProbablyEnchantedWord(word: string): boolean {
  const segmenter = new Intl.Segmenter();
  return (
    [...segmenter.segment(word)]
      .map((chunk) => chunk.segment)
      .reverse()
      .join('') === word
  );
}

// Inputs parser

function parser(answer: string): unknown[] | undefined {
  const lines = answer.trim().split('\n');
  if (lines.length < 1) {
    throw new Error(`Your answer should be made of one line`);
  }
  return [lines[0]];
}
