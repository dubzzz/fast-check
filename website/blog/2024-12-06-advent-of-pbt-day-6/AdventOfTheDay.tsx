import adventBuggy from './buggy.mjs';
import adventBuggyRaw from './buggy.mjs?raw';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 6,
  buggyAdvent: adventBuggy,
  snippet: adventBuggyRaw,
  referenceAdvent: nextBarcode, // same as adventBuggy but with unitPerNumerical=10, not buggy as 25**10 is far from MAX_SAFE_INTEGER
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

type Unit =
  | '✉️'
  | '🧺'
  | '🎄'
  | '🔔'
  | '🕯️'
  | '⭐'
  | '🦌'
  | '⛄'
  | '🛷'
  | '❄️'
  | '🎿'
  | '✨'
  | '🤩'
  | '🥳'
  | '🎈'
  | '🪀'
  | '🎮'
  | '🎲'
  | '♟️'
  | '💝'
  | '🎀'
  | '🧦'
  | '🎅'
  | '🤶'
  | '🎁';

function nextBarcode(barcode: Unit[]): Unit[] {
  const units: Unit[] = [
    '\u{2709}\u{fe0f}',
    '\u{1f9fa}',
    '\u{1f384}',
    '\u{1f514}',
    '\u{1f56f}\u{fe0f}',
    '\u{2b50}',
    '\u{1f98c}',
    '\u{26c4}',
    '\u{1f6f7}',
    '\u{2744}\u{fe0f}',
    '\u{1f3bf}',
    '\u{2728}',
    '\u{1f929}',
    '\u{1f973}',
    '\u{1f388}',
    '\u{1fa80}',
    '\u{1f3ae}',
    '\u{1f3b2}',
    '\u{265f}\u{fe0f}',
    '\u{1f49d}',
    '\u{1f380}',
    '\u{1f9e6}',
    '\u{1f385}',
    '\u{1f936}',
    '\u{1f381}',
  ];
  const base25 = '0123456789abcdefghijklmno';

  const unitPerNumerical = 10;
  const maxForNumerical = units.length ** unitPerNumerical;
  const numericalVersion = [];

  // Create numerical value for current
  for (let i = barcode.length; i > 0; i -= unitPerNumerical) {
    const unitsForNumerical = barcode.slice(Math.max(0, i - unitPerNumerical), i);
    let numerical = 0;
    for (const unit of unitsForNumerical) {
      numerical *= units.length;
      numerical += units.indexOf(unit);
    }
    numericalVersion.push(numerical);
  }

  // Compute next numerical value
  let nextNumericalVersion = [...numericalVersion, 0];
  let cursorInNext = 0;
  nextNumericalVersion[cursorInNext] += 1;
  while (nextNumericalVersion[cursorInNext] >= maxForNumerical) {
    nextNumericalVersion[cursorInNext] = 0;
    cursorInNext += 1;
    nextNumericalVersion[cursorInNext] += 1;
  }
  if (nextNumericalVersion[nextNumericalVersion.length - 1] === 0) {
    nextNumericalVersion = nextNumericalVersion.slice(0, nextNumericalVersion.length - 1);
  }
  nextNumericalVersion.reverse();

  // Translate next numerical value into a barcode
  const next: Unit[] = [];
  for (let numericalIndex = 0; numericalIndex !== nextNumericalVersion.length; ++numericalIndex) {
    let numericalBase25 = nextNumericalVersion[numericalIndex].toString(25);
    if (numericalIndex !== 0) {
      numericalBase25 = numericalBase25.padStart(unitPerNumerical, '0');
    }
    for (const in25 of numericalBase25) {
      next.push(units[base25.indexOf(in25)]);
    }
  }
  return next;
}

// Inputs parser

const validBarcodeRegex = /^(✉️|🧺|🎄|🔔|🕯️|⭐|🦌|⛄|🛷|❄️|🎿|✨|🤩|🥳|🎈|🪀|🎮|🎲|♟️|💝|🎀|🧦|🎅|🤶|🎁)+$/;
function parser(answer: string): unknown[] | undefined {
  const lines = answer.split('\n');
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
