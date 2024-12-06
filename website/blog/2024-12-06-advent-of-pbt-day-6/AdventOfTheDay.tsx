import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 6,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: adventBuggy(10), // not buggy as 25**10 is far from MAX_SAFE_INTEGER
  parser,
  placeholderForm: '🧺🎁',
  functionName: 'nextBarcode',
  signature: 'function nextBarcode(barcode: Unit[]): Unit[];',
  signatureExtras: [
    "type Unit = '✉️'|'🧺'|'🎄'|'🔔'|'🕯️'|'⭐'|'🦌'|'⛄'|'🛷'|'❄️'|'🎿'|'✨'|'🤩'|'🥳'|'🎈'|'🪀'|'🎮'|'🎲'|'♟️'|'💝'|'🎀'|'🧦'|'🎅'|'🤶'|'🎁';",
  ],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

// Inputs parser

const validBarcodeRegex = /^(✉️|🧺|🎄|🔔|🕯️|⭐|🦌|⛄|🛷|❄️|🎿|✨|🤩|🥳|🎈|🪀|🎮|🎲|♟️|💝|🎀|🧦|🎅|🤶|🎁)+$/;
function parser(answer: string): unknown[] | undefined {
  const lines = answer.trim().split('\n');
  if (lines.length !== 1) {
    throw new Error(`Your answer should be made of one line`);
  }
  if (lines[0] !== '✉️' && !validBarcodeRegex.test(lines[0])) {
    throw new Error('Invalid barcode provided');
  }
  const barcodeExtractorRegex = /(✉️|🧺|🎄|🔔|🕯️|⭐|🦌|⛄|🛷|❄️|🎿|✨|🤩|🥳|🎈|🪀|🎮|🎲|♟️|💝|🎀|🧦|🎅|🤶|🎁)/g;
  const barcode = [];
  let m: RegExpExecArray | null = null;
  while ((m = barcodeExtractorRegex.exec(lines[0])) !== null) {
    barcode.push(m[1]);
  }
  return [barcode];
}
