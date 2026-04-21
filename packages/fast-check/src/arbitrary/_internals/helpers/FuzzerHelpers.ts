import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { constant } from '../../constant.js';
import { oneof } from '../../oneof.js';

/**
 * Build an {@link Arbitrary} from a map of values to occurrence counts. *
 * @internal
 */
export function hitCountToArbitrary<T>(hit: Map<T, number>, endSignal: T): Arbitrary<T> {
  const hitArbitraryEntries: { weight: number; arbitrary: Arbitrary<T> }[] = [];
  let endTokenArb: Arbitrary<T> | undefined = undefined;
  for (const [value, count] of hit) {
    const arbitrary = constant(value);
    if (value === endSignal) {
      endTokenArb = arbitrary;
    }
    hitArbitraryEntries.push({ weight: count, arbitrary });
  }
  if (endTokenArb !== undefined) {
    hitArbitraryEntries.sort((a, b) => (a.arbitrary === endTokenArb ? -1 : b.arbitrary === endTokenArb ? 1 : 0));
  }
  return oneof({ withCrossShrink: true }, ...hitArbitraryEntries);
}

/**
 * Compute a positional strength boosting tokens located near `requestedIndex`
 * @internal
 */
export function positionalStrength(requestedIndex: number, pos: number, length: number): number {
  const cappedIndex = Math.min(requestedIndex, length);
  const strength = Math.max(1, 3 - Math.abs(cappedIndex - pos));
  return strength * strength;
}

/**
 * Aggregate per-token weights across the corpus, biased toward tokens near `index` via {@link positionalStrength}.
 * @internal
 */
export function computeEntropyEntriesAt<T>(corpusRefined: string[][], endSignal: T, index: number): Map<T, number> {
  const hit = new Map<T, number>();
  for (const tokens of corpusRefined) {
    for (let pos = 0; pos !== tokens.length; ++pos) {
      const c = tokens[pos] as unknown as T;
      const count = hit.get(c) ?? 0;
      hit.set(c, count + positionalStrength(index, pos, tokens.length));
    }
    const count = hit.get(endSignal) ?? 0;
    hit.set(endSignal, count + positionalStrength(index, tokens.length, tokens.length));
  }
  return hit;
}
