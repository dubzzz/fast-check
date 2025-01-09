import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 22,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: computeSantaMindScore,
  parser,
  placeholderForm: '🎄🎁⛄🎈🎅\n🎁🎄⛄🎄🦌',
  functionName: 'computeSantaMindScore',
  signature:
    'findOptimalPacking(secretSequence: Sequence, guessedSequence: Sequence): { goodPlacement: number; misplaced: number };',
  signatureExtras: [
    "type Icon = '🎄' | '🦌' | '⛄' | '🛷' | '🎈' | '🎀' | '🎅' | '🎁';",
    'type Sequence = [Icon, Icon, Icon, Icon, Icon];',
  ],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

type Icon = '🎄' | '🦌' | '⛄' | '🛷' | '🎈' | '🎀' | '🎅' | '🎁';
type Sequence = [Icon, Icon, Icon, Icon, Icon];

function computeSantaMindScore(
  secretSequence: Sequence,
  guessedSequence: Sequence,
): { goodPlacement: number; misplaced: number } {
  const badlyPlacedInSecret = secretSequence.filter((item, index) => item !== guessedSequence[index]);
  const badlyPlacedInGuessed = guessedSequence.filter((item, index) => item !== secretSequence[index]);
  const goodPlacement = 5 - badlyPlacedInSecret.length;
  let misplaced = 0;
  for (const item of badlyPlacedInGuessed) {
    const indexInSecret = badlyPlacedInSecret.indexOf(item);
    if (indexInSecret !== -1) {
      ++misplaced;
      badlyPlacedInSecret.splice(indexInSecret, 1);
    }
  }
  return { goodPlacement, misplaced };
}

// Inputs parser

const sequenceRegex = /^[\u{1f384}\u{1f98c}\u{26c4}\u{1f6f7}\u{1f388}\u{1f380}\u{1f385}\u{1f381}]{5}$/u;

function parser(answer: string): unknown[] | undefined {
  const lines = answer.split('\n');
  if (lines.length !== 2) {
    throw new Error('Expected two lines, each of them made of one sequence of 5 icons');
  }
  const secret = sequenceRegex.exec(lines[0]);
  if (secret === null) {
    throw new Error(`Expected one sequence of 5 icons for the secret. Received: ${lines[0]}.`);
  }
  const guessed = sequenceRegex.exec(lines[1]);
  if (guessed === null) {
    throw new Error(`Expected one sequence of 5 icons for the guess. Received: ${lines[1]}.`);
  }
  return [[...secret[0]], [...guessed[0]]];
}
