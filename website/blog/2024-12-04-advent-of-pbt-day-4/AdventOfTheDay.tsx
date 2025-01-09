import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 4,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: fastPostOfficeFinderEmulator,
  postAdvent: (value) => Number(value) >= 0 && Number(value) <= 14,
  parser,
  placeholderForm: 'initial:0,0\nbox:0,0',
  functionName: 'fastPostOfficeFinderEmulator',
  signature: 'function fastPostOfficeFinderEmulator(initialPosition: Position, targetPosition: Position): number;',
  signatureExtras: ['type Position = { x: number; y: number };'],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

const SizeX = 10000;
const SizeY = 1000;

type Position = { x: number; y: number };

function fastPostOfficeFinderEmulator(initialPosition: Position, targetPosition: Position): number {
  let xMin = 0;
  let xMax = SizeX;
  let yMin = 0;
  let yMax = SizeY;
  let x = initialPosition.x;
  let y = initialPosition.y;
  let numMoves = 0;
  while (x !== targetPosition.x || y !== targetPosition.y) {
    if (xMin >= xMax || yMin >= yMax) {
      return Number.POSITIVE_INFINITY; // error
    }
    const prevX = x;
    const prevY = y;
    if (targetPosition.y < y) {
      yMax = y;
      y = Math.floor((yMax + yMin) / 2);
    } else if (targetPosition.y > y) {
      yMin = y + 1;
      y = Math.floor((yMax + yMin) / 2);
    }
    if (targetPosition.x < x) {
      xMax = x;
      x = Math.floor((xMax + xMin) / 2);
    } else if (targetPosition.x > x) {
      xMin = x + 1;
      x = Math.floor((xMax + xMin) / 2);
    }
    if (prevX !== x || prevY !== y) {
      ++numMoves;
      if (numMoves > 1000) {
        return Number.POSITIVE_INFINITY; // probably an error somewhere
      }
    }
  }
  return numMoves;
}

// Inputs parser

const initialRegex = /^initial\s*:\s*(\d{1,4})\s*,\s*(\d{1,3})$/;
const boxRegex = /^box\s*:\s*(\d{1,4})\s*,\s*(\d{1,3})$/;

function parser(answer: string): unknown[] | undefined {
  const lines = answer.split('\n');
  if (lines.length !== 2) {
    throw new Error(
      `Your answer should be made of two distinct lines: the first line for the initial location, the second one for the box`,
    );
  }
  const mInit = initialRegex.exec(lines[0]);
  if (mInit === null) {
    throw new Error(
      'The initial location should be of the form: `initial:x,y` with x between 0 and 9999 and y between 0 and 999',
    );
  }
  const mBox = boxRegex.exec(lines[1]);
  if (mBox === null) {
    throw new Error(
      'The box location should be of the form: `box:x,y` with x between 0 and 9999 and y between 0 and 999',
    );
  }
  return [
    { x: Number(mInit[1]), y: Number(mInit[2]) },
    { x: Number(mBox[1]), y: Number(mBox[2]) },
  ];
}
