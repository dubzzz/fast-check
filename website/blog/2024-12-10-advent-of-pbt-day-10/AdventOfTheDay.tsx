import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 10,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: isProbablyEnchantedWordV2,
  parser,
  placeholderForm: 'any set of characters as long as it fits on one line',
  functionName: 'isProbablyEnchantedWordV2',
  signature: 'isProbablyEnchantedWordV2(word: string): string;',
  signatureExtras: [],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

function isProbablyEnchantedWordV2(word: string): boolean {
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
  const lines = answer.split('\n');
  if (lines.length < 1) {
    throw new Error(`Your answer should be made of one line`);
  }
  return [lines[0]];
}
