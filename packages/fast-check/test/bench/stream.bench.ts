import { describe, bench } from 'vitest';
import { stream } from '../../src/stream/Stream.js';

// This benchmark compares fast-check's own `Stream` class against the native
// iterator-helper methods (`Iterator.prototype.map`, `filter`, `take`, ...)
// shipped by modern runtimes — both performing the equivalent lazy operation.
//
// Two kinds of producers feed each pipeline so we can observe how the source
// shape impacts the comparison:
//   - a generator function, emulating a purely lazy iterable producer;
//   - a plain array, the most common eager in-memory source.
// For array producers we additionally show the idiomatic eager
// `Array.prototype` equivalent as a reference point.
//
// Node 22+ (and other modern engines) ship the TC39 iterator-helpers proposal
// natively, but the TypeScript lib this project targets (ES2020) does not yet
// expose their typings. The native helper calls below are therefore flagged
// with `@ts-expect-error`; they run perfectly fine at runtime.

// Number of elements produced by each source.
const N = 1000;
// Cut-off used by the `take`/`drop` based scenarios.
const HALF = N >> 1;

// Read-only array source, reused across iterations (a fresh iterator is taken
// from it on every run via `.values()`).
const sourceArray: readonly number[] = Array.from({ length: N }, (_, i) => i);

// Generator-based producer emulating a lazy iterable source. A brand new
// generator must be created on every run since generators are single-use.
function* range(n: number): IterableIterator<number> {
  for (let i = 0; i < n; ++i) {
    yield i;
  }
}

// Fully drains an iterator and returns a checksum so the engine cannot
// optimize the lazy pipeline away as dead code.
function drain(it: Iterator<number>): number {
  let acc = 0;
  for (let cur = it.next(); !cur.done; cur = it.next()) {
    acc += cur.value;
  }
  return acc;
}

// Sums an array with a plain loop, the consume step for the eager references.
function sumArray(arr: readonly number[]): number {
  let acc = 0;
  for (let i = 0; i !== arr.length; ++i) {
    acc += arr[i];
  }
  return acc;
}

const timesTwo = (v: number): number => v * 2;
const isEven = (v: number): boolean => (v & 1) === 0;
const isPositiveOrZero = (v: number): boolean => v >= 0;
const isLast = (v: number): boolean => v === N - 1;
const duplicateArray = (v: number): number[] => [v, v];
const duplicateIterator = (v: number): IterableIterator<number> => [v, v].values();

describe('Stream::map', () => {
  bench('Stream + generator', () => void drain(stream(range(N)).map(timesTwo)));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + generator', () => void drain(range(N).map(timesTwo)));
  bench('Stream + array', () => void drain(stream(sourceArray.values()).map(timesTwo)));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + array', () => void drain(sourceArray.values().map(timesTwo)));
  bench('Array.prototype + array', () => void sumArray(sourceArray.map(timesTwo)));
});

describe('Stream::filter', () => {
  bench('Stream + generator', () => void drain(stream(range(N)).filter(isEven)));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + generator', () => void drain(range(N).filter(isEven)));
  bench('Stream + array', () => void drain(stream(sourceArray.values()).filter(isEven)));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + array', () => void drain(sourceArray.values().filter(isEven)));
  bench('Array.prototype + array', () => void sumArray(sourceArray.filter(isEven)));
});

describe('Stream::take', () => {
  bench('Stream + generator', () => void drain(stream(range(N)).take(HALF)));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + generator', () => void drain(range(N).take(HALF)));
  bench('Stream + array', () => void drain(stream(sourceArray.values()).take(HALF)));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + array', () => void drain(sourceArray.values().take(HALF)));
  bench('Array.prototype + array', () => void sumArray(sourceArray.slice(0, HALF)));
});

describe('Stream::drop', () => {
  bench('Stream + generator', () => void drain(stream(range(N)).drop(HALF)));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + generator', () => void drain(range(N).drop(HALF)));
  bench('Stream + array', () => void drain(stream(sourceArray.values()).drop(HALF)));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + array', () => void drain(sourceArray.values().drop(HALF)));
  bench('Array.prototype + array', () => void sumArray(sourceArray.slice(HALF)));
});

describe('Stream::flatMap', () => {
  bench('Stream + generator', () => void drain(stream(range(N)).flatMap(duplicateIterator)));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + generator', () => void drain(range(N).flatMap(duplicateArray)));
  bench('Stream + array', () => void drain(stream(sourceArray.values()).flatMap(duplicateIterator)));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + array', () => void drain(sourceArray.values().flatMap(duplicateArray)));
  bench('Array.prototype + array', () => void sumArray(sourceArray.flatMap(duplicateArray)));
});

// Terminal operation walking through every element (predicate stays truthy).
describe('Stream::every', () => {
  bench('Stream + generator', () => void stream(range(N)).every(isPositiveOrZero));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + generator', () => void range(N).every(isPositiveOrZero));
  bench('Stream + array', () => void stream(sourceArray.values()).every(isPositiveOrZero));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + array', () => void sourceArray.values().every(isPositiveOrZero));
  bench('Array.prototype + array', () => void sourceArray.every(isPositiveOrZero));
});

// Terminal search hitting the very last element (`Stream::has` ~ `Iterator::find`).
describe('Stream::has', () => {
  bench('Stream + generator', () => void stream(range(N)).has(isLast));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + generator', () => void range(N).find(isLast));
  bench('Stream + array', () => void stream(sourceArray.values()).has(isLast));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + array', () => void sourceArray.values().find(isLast));
  bench('Array.prototype + array', () => void sourceArray.find(isLast));
});

// A realistic chained pipeline: map -> filter -> take.
describe('Stream::pipeline (map+filter+take)', () => {
  bench('Stream + generator', () => void drain(stream(range(N)).map(timesTwo).filter(isEven).take(HALF)));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + generator', () => void drain(range(N).map(timesTwo).filter(isEven).take(HALF)));
  bench('Stream + array', () => void drain(stream(sourceArray.values()).map(timesTwo).filter(isEven).take(HALF)));
  // @ts-expect-error -- Native iterator helpers are not part of the ES2020 TS lib targeted here
  bench('native iterator + array', () => void drain(sourceArray.values().map(timesTwo).filter(isEven).take(HALF)));
  bench('Array.prototype + array', () => void sumArray(sourceArray.map(timesTwo).filter(isEven).slice(0, HALF)));
});
