import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 20,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: findStartIndex,
  parser,
  placeholderForm: '1\n2\n3\n3\n9',
  functionName: 'findStartIndex',
  signature: 'findStartIndex(partlyShuffled: number[]): number;',
  signatureExtras: [],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

function findStartIndex(partlyShuffled) {
  if (partlyShuffled.length === 0) {
    return -1;
  }
  for (let i = 0; i < partlyShuffled.length; ++i) {
    if (partlyShuffled[i - 1] > partlyShuffled[i]) {
      return i;
    }
  }
  if (partlyShuffled[partlyShuffled.length - 1] > partlyShuffled[0]) {
    return 0;
  }
}

// Inputs parser

const presentRegex = /^(\d+)$/;

function parser(answer: string): unknown[] | undefined {
  const lines = answer.split('\n');
  const items: number[] = [];
  for (let i = 0; i < lines.length - 1; ++i) {
    const m = presentRegex.exec(lines[i]);
    if (m === null) {
      throw new Error(`All lines except must be of the form <item>. Received: ${lines[i]}.`);
    }
    const weight = Number(m[1]);
    if (!Number.isInteger(weight)) {
      throw new Error(`The value of items must be integer. Received: ${m[1]}.`);
    }
    items.push(weight);
  }
  if (items.length === 0) {
    throw new Error(`Must provide at least one item.`);
  }
  if (items.every((i) => i === items[0])) {
    throw new Error(`Must provide at least two distinct items.`);
  }
  let numJumps = 0;
  for (let i = 0; i < items.length; ++i) {
    if (items[i - 1] > items[i]) {
      numJumps += 1;
    }
  }
  if (items[items.length - 1] > items[0]) {
    numJumps += 1;
  }
  if (numJumps !== 1) {
    throw new Error(`Must be partially sorted.`);
  }
  return [items];
}
