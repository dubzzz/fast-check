import adventBuggy from './buggy.mjs';
import { buildAdventOfTheDay } from '../2024-12-01-advent-of-pbt-day-1/AdventOfTheDayBuilder';

const { AdventPlaygroundOfTheDay, FormOfTheDay } = buildAdventOfTheDay({
  day: 12,
  buildBuggyAdvent: adventBuggy,
  referenceAdvent: planFastTravel,
  postAdvent: (route: Track[] | undefined) =>
    route !== undefined ? route.reduce((acc, track) => acc + track.distance, 0) : undefined,
  parser,
  placeholderForm: 'a>b=6\nb>c=8\nc>b=6\na>c?',
  functionName: 'planFastTravel',
  signature: 'planFastTravel(departure: string, destination: string, tracks: Track[]): Track[] | undefined;',
  signatureExtras: ['type Track = { from: string; to: string; distance: number };'],
});

export { AdventPlaygroundOfTheDay, FormOfTheDay };

// Reference implementation

type Track = { from: string; to: string; distance: number };

function planFastTravel(departure: string, destination: string, tracks: Track[]): Track[] | undefined {
  const distanceToNode = new Map<string, { distance: number; edges: Track[] }>(
    [departure, destination, ...tracks.map((t) => t.from), ...tracks.map((t) => t.to)].map((node) => [
      node,
      { distance: Number.POSITIVE_INFINITY, edges: [] },
    ]),
  );
  if (distanceToNode.has(departure)) {
    distanceToNode.set(departure, { distance: 0, edges: [] });
  }
  while (true) {
    const nextNode = findRemainingNodeWithMinimalDistance(distanceToNode);
    if (nextNode === undefined) {
      return undefined; // no path found
    }
    const data = distanceToNode.get(nextNode)!;
    if (nextNode === destination) {
      return data.edges;
    }
    distanceToNode.delete(nextNode);
    for (const e of tracks) {
      if (
        e.from === nextNode &&
        distanceToNode.has(e.to) &&
        distanceToNode.get(e.to)!.distance > data.distance + e.distance
      ) {
        distanceToNode.set(e.to, {
          distance: data.distance + e.distance,
          edges: [...data.edges, e],
        });
      }
    }
  }
}

function findRemainingNodeWithMinimalDistance(
  distanceToNode: Map<string, { distance: number; edges: Track[] }>,
): string | undefined {
  let minNode: string | undefined = undefined;
  let minDistance = Number.POSITIVE_INFINITY;
  for (const [node, { distance }] of distanceToNode) {
    if (distance < minDistance) {
      minNode = node;
      minDistance = distance;
    }
  }
  return minNode;
}

// Inputs parser

const routeRegex = /^([a-z])>([a-z])=(\d+)$/;
const queryRegex = /^([a-z])>([a-z])\?$/;

function parser(answer: string): unknown[] | undefined {
  const lines = answer.split('\n');
  if (lines.length < 1) {
    throw new Error(`Your answer should be made of at least one line`);
  }
  const tracks: Track[] = [];
  for (let i = 0; i < lines.length - 1; ++i) {
    const m = routeRegex.exec(lines[i]);
    if (m === null) {
      throw new Error(
        `All lines except the last one should declare edges of the form: a>b=distance. Received: ${lines[i]}.`,
      );
    }
    const distance = Number(m[3]);
    if (distance <= 0 || distance > 2 ** 31 - 1 || Number.isNaN(distance) || !Number.isInteger(distance)) {
      throw new Error(
        `All lines except the last one should declare edges with distance in [1, 2**31-1]. Received: ${lines[i]}.`,
      );
    }
    tracks.push({ from: m[1], to: m[2], distance });
  }
  const m = queryRegex.exec(lines[lines.length - 1]);
  if (m === null) {
    throw new Error(
      `The last line must be a query for a route of the form: a>b?. Received: ${lines[lines.length - 1]}.`,
    );
  }
  return [m[1], m[2], tracks];
}
