import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 5,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: isSecurityKey,
  parser,
  placeholderForm: '6',
  functionName: 'isSecurityKey',
  signature: 'function isSecurityKey(potentialSecurityKey: number): boolean;',
  signatureExtras: [],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

function isSecurityKey(potentialSecurityKey: number): boolean {
  let key = potentialSecurityKey;
  const sqrtKey = Math.floor(Math.sqrt(key));

  let i = 2;
  const factors = [];
  while (i <= sqrtKey) {
    if (key % i === 0) {
      factors.push(i);
      key /= i;
    } else {
      ++i;
    }
  }
  if (key >= 2) {
    factors.push(key);
  }
  return factors.length === 2 && new Set(factors).size === 2;
}

// Inputs parser

function parser(answer: string): unknown[] | undefined {
  const lines = answer.split('\n');
  if (lines.length !== 1) {
    throw new Error(`Your answer should be made of one line`);
  }
  const value = Number(lines[0]);
  if (value < 2 || value > 2147483647) {
    throw new Error('The proposed key must be within 2 and 2147483647');
  }
  return [value];
}
