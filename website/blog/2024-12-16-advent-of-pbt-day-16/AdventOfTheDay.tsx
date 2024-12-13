import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 16,
  buildBuggyAdvent: adventBuggy,
  buggyAdventSurcharged: (index: number) => {
    return !isBuggyIndexWithBefore(index) && !isBuggyIndexWithBefore(index + 1);
  },
  referenceAdvent: () => true, // success (aka no-bug) = true
  parser,
  placeholderForm: '5',
  functionName: 'santaCode',
  signature: 'santaCode(n: number): number;',
  signatureExtras: [],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

function isBuggyIndexWithBefore(index: number) {
  if (index <= 0) {
    return false;
  }
  const codeN = adventBuggy()(index);
  const binaryCodeN = BigInt(codeN).toString(2);
  const codeNBefore = adventBuggy()(index - 1);
  const binaryCodeNBefore = BigInt(codeNBefore).toString(2).padStart(binaryCodeN.length, '0');
  let diffCount = 0;
  for (let index = 0; index !== binaryCodeN.length; ++index) {
    if (binaryCodeN[index] !== binaryCodeNBefore[index]) {
      diffCount += 1;
    }
  }
  return diffCount !== 1;
}

// Inputs parser

const routeRegex = /^([a-z])>([a-z])=(\d+)$/;
const queryRegex = /^([a-z])>([a-z])\?$/;

function parser(answer: string): unknown[] | undefined {
  const lines = answer.trim().split('\n');
  if (lines.length !== 1) {
    throw new Error(`Your answer should be made of exactly one line`);
  }
  const index = Number(lines[0]);
  if (index < 0 || index >= 2 ** 31 || Number.isNaN(index) || !Number.isInteger(index)) {
    throw new Error(`The index should be a positive integer in the range: 0 to 2**31-1`);
  }
  return [index];
}
