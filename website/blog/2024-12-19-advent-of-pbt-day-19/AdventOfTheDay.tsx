import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 19,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: findOptimalPacking,
  postAdvent: (sleights: number[][]) => sleights.length,
  parser,
  placeholderForm: '1\n2\n3\n3\n9',
  functionName: 'findOptimalPacking',
  signature: 'findOptimalPacking(weights: number[]): number[][];',
  signatureExtras: [],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

function findOptimalPackingInternal(weights: number[], remaining: number): number[][] {
  if (weights.length === 0) {
    return [];
  }
  if (weights.reduce((acc, v) => acc + v, 0) <= remaining) {
    return [weights];
  }
  let bestPacking = null;
  for (let i = 0; i !== weights.length; ++i) {
    if (remaining - weights[i] < 0) {
      continue;
    }
    const otherWeights = [...weights];
    otherWeights.splice(i, 1);
    const nextPacks = findOptimalPackingInternal(otherWeights, remaining - weights[i]);
    if (bestPacking === null || bestPacking.length > nextPacks.length) {
      bestPacking = [[weights[i], ...(nextPacks[0] ?? [])], ...nextPacks];
    }
  }
  if (bestPacking !== null) {
    return bestPacking;
  }
  const [current, ...otherWeights] = weights;
  const nextPacks = findOptimalPackingInternal(otherWeights, 10 - current);
  return [[], ...nextPacks];
}

function findOptimalPacking(weights: number[]): number[][] {
  return findOptimalPackingInternal(weights, 10);
}

// Inputs parser

const presentRegex = /^(\d+)$/;

function parser(answer: string): unknown[] | undefined {
  const lines = answer.split('\n');
  const presents: number[] = [];
  for (let i = 0; i < lines.length - 1; ++i) {
    const m = presentRegex.exec(lines[i]);
    if (m === null) {
      throw new Error(`All lines except must be of the form <weight>. Received: ${lines[i]}.`);
    }
    const weight = Number(m[1]);
    if (!Number.isInteger(weight) || weight < 1 || weight > 10) {
      throw new Error(`The value of weight must be integer in [1 to 10]. Received: ${m[1]}.`);
    }
    presents.push(weight);
  }
  return [presents];
}
