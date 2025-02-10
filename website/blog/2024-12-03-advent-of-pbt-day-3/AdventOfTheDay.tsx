import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 3,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: isWordIncludedInLetter,
  parser,
  placeholderForm: '"content of the letter"\n"word"',
  functionName: 'isWordIncludedInLetter',
  signature: 'function isWordIncludedInLetter(letterContent: string, word: string): boolean;',
  signatureExtras: [],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

function isWordIncludedInLetter(letterContent: string, word: string): boolean {
  return letterContent.includes(word);
}

// Inputs parser

function parser(answer: string): unknown[] | undefined {
  const lines = answer.split('\n');
  if (lines.length !== 2) {
    throw new Error(
      `Your answer should be made of two distinct lines: one for the content of the letter and the other for the word being looked for`,
    );
  }
  const parsedLetterContent = JSON.parse(lines[0]);
  if (typeof parsedLetterContent !== 'string') {
    throw new Error('The content of the letter should follow the pattern: "quoted-string"');
  }
  const parsedWord = JSON.parse(lines[1]);
  if (typeof parsedWord !== 'string') {
    throw new Error('The word should follow the pattern: "quoted-string"');
  }
  return [parsedLetterContent, parsedWord];
}
