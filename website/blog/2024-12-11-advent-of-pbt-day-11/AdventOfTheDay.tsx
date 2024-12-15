import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 11,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: findPlaceForSanta,
  postAdvent: (answer) => answer !== undefined,
  parser,
  placeholderForm: '<width>,<height>\n.....\n.....\n.....\n..xx.',
  functionName: 'findPlaceForSanta',
  signature: 'function findPlaceForSanta(map: MarketMap, requestedArea: RequestedSize): Location | undefined;',
  signatureExtras: [
    'type MarketMap = boolean[][];',
    'type RequestedSize = { width: number; height: number };',
    'type Location= { x: number; y: number };',
  ],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

function findPlaceForSanta(
  map: boolean[][],
  requestedArea: { width: number; height: number },
): { x: number; y: number } | undefined {
  for (let y = 0; y !== map.length; ++y) {
    for (let x = 0; x !== map[0].length; ++x) {
      const location = { x, y };
      const placeIsValid = isValidPlace(map, location, requestedArea);
      if (placeIsValid) {
        return location;
      }
    }
  }
  return undefined;
}

function isValidPlace(
  map: boolean[][],
  start: { x: number; y: number },
  requestedArea: { width: number; height: number },
): boolean {
  for (let dy = 0; dy !== requestedArea.height; ++dy) {
    const line = map[start.y + dy];
    if (line === undefined) {
      return false;
    }
    for (let dx = 0; dx !== requestedArea.width; ++dx) {
      const cell = line[start.x + dx];
      if (cell === undefined) {
        return false;
      }
      if (!cell) {
        return false;
      }
    }
  }
  return true;
}

// Inputs parser

const positionRegex = /^(\d)+,(\d+)$/;
const gridLineRegex = /^[\.x]+$/;

function parser(answer: string): unknown[] | undefined {
  const lines = answer.split('\n');
  if (lines.length < 1) {
    throw new Error(`Your answer should be made of one line`);
  }
  const mPos = positionRegex.exec(lines[0]);
  if (mPos === null) {
    throw new Error(
      `The first line is supposed to give the size being requested by Santa for the Market with the form: <width>,<height>. Received: ${lines[0]}.`,
    );
  }
  let lineSize = -1;
  const grid: boolean[][] = [];
  for (let i = 1; i < lines.length; ++i) {
    const m = gridLineRegex.exec(lines[i]);
    if (m === null) {
      throw new Error(
        `Each line of the grid declaring the market should be made of only . or x. Received: ${lines[i]}.`,
      );
    }
    const lineOfGrid = lines[i].split('').map((c) => c === '.');
    grid.push(lineOfGrid);
    if (lineSize !== -1 && lineOfGrid.length !== lineSize) {
      throw new Error(`Grid must be rectangular, all the lines of the grids have the same width.`);
    }
  }
  return [grid, { width: Number(mPos[1]), height: Number(mPos[2]) }];
}
