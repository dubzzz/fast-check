import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 18,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: findOptimalJourney,
  postAdvent: (route: House[]) => {
    let totalDistance = 0;
    for (let i = 1; i < route.length; ++i) {
      totalDistance += distance(route[i - 1], route[i]);
    }
    return totalDistance;
  },
  parser,
  placeholderForm: '1,2\n10,9\n200,15',
  functionName: 'findOptimalJourney',
  signature: 'findOptimalJourney(houses: House[]): House[];',
  signatureExtras: ['type House = { x: number; y: number };'],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

type House = { x: number; y: number };

const santaHouse = { x: 0, y: 0 };

function findOptimalJourneyInternal(houses: House[], lastHouse: House): { journey: House[]; distance: number } {
  if (houses.length === 0) {
    return { journey: [lastHouse], distance: distance({ ...santaHouse }, lastHouse) };
  }
  let bestMatchDistance: number = Number.POSITIVE_INFINITY;
  let bestMatchJourney: House[] = [];
  for (let i = 0; i !== houses.length; ++i) {
    const fromLastHouse = distance(lastHouse, houses[i]);
    const otherHouses = houses.slice();
    otherHouses.splice(i, 1);
    const rec = findOptimalJourneyInternal(otherHouses, lastHouse);
    if (bestMatchDistance > rec.distance + fromLastHouse) {
      bestMatchDistance = rec.distance + fromLastHouse;
      bestMatchJourney = rec.journey;
    }
  }
  return {
    journey: [lastHouse, ...bestMatchJourney],
    distance: bestMatchDistance,
  };
}

function findOptimalJourney(houses: House[]): House[] {
  return findOptimalJourneyInternal(houses, { ...santaHouse }).journey;
}

function distance(houseA: House, houseB: House) {
  return Math.abs(houseA.x - houseB.x) + Math.abs(houseA.y - houseB.y);
}

// Inputs parser

const houseRegex = /^(\d+),(\d+)$/;

function parser(answer: string): unknown[] | undefined {
  const lines = answer.split('\n');
  const houses: House[] = [];
  for (let i = 0; i < lines.length - 1; ++i) {
    const m = houseRegex.exec(lines[i]);
    if (m === null) {
      throw new Error(`All lines except must be of the form <x>,<y>. Received: ${lines[i]}.`);
    }
    const x = Number(m[1]);
    const y = Number(m[2]);
    if (!Number.isInteger(x) || x < 0 || x > 1000) {
      throw new Error(`The value of x must be integer in [0 to 1000]. Received: ${m[1]}.`);
    }
    if (!Number.isInteger(y) || y < 0 || y > 1000) {
      throw new Error(`The value of y must be integer in [0 to 1000]. Received: ${m[2]}.`);
    }
    houses.push({ x, y });
  }
  return [houses];
}
