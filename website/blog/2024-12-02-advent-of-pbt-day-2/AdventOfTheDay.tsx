import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 2,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: dropLettersFromDuplicatedSenders,
  parser,
  placeholderForm: '"first-id"\n"second-id-with\\xA0fancy\\ncharacters\\u{1f431}"\n"with escaped \\" double quotes"',
  functionName: 'dropLettersFromDuplicatedSenders',
  signature: 'function dropLettersFromDuplicatedSenders(letters: Letter[]): Letter[];',
  signatureExtras: ['type Letter = { id: string };'],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

type Letter = { id: string };

function dropLettersFromDuplicatedSenders(letters: Letter[]): Letter[] {
  const alreadySeenIds = new Set();
  return letters.filter((letter) => {
    if (alreadySeenIds.has(letter.id)) {
      return false;
    }
    alreadySeenIds.add(letter.id);
    return true;
  });
}

// Inputs parser

function parser(answer: string): unknown[] | undefined {
  const parsedAnswer: Letter[] = [];
  for (const line of answer.trim().split('\n')) {
    const parsed = JSON.parse(line);
    if (typeof parsed !== 'string') {
      throw new Error('Each line of the answer should follow the pattern: "quoted-string-being-the-id"');
    }
    parsedAnswer.push({ id: parsed });
  }
  return [parsedAnswer];
}
