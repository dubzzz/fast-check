import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { safeJoin, safeSubstring, Error } from '../../../utils/globals.js';

/** @internal - tab is supposed to be composed of valid entries extracted from the source arbitraries */
export function partsToJoinedStringMapper(tab: string[]): string {
  return safeJoin(tab, '');
}

/** @internal */
function tryUnmapJoinedString(
  value: string,
  startIndex: number,
  arbitraries: Arbitrary<string>[],
  arbIndex: number,
  minLengths: number[],
  maxLengths: number[],
  suffixMinLengths: number[],
  suffixMaxLengths: number[],
  failedCache: Set<number>,
): string[] | undefined {
  if (arbIndex === arbitraries.length) {
    return startIndex === value.length ? [] : undefined;
  }
  const cacheKey = startIndex * arbitraries.length + arbIndex;
  if (failedCache.has(cacheKey)) {
    return undefined;
  }
  const remaining = value.length - startIndex;
  const minFromSuffix = remaining - suffixMaxLengths[arbIndex + 1];
  const minChunkLen = Math.max(minLengths[arbIndex], minFromSuffix);
  const maxChunkLen = Math.min(maxLengths[arbIndex], remaining - suffixMinLengths[arbIndex + 1]);
  if (minChunkLen > maxChunkLen) {
    failedCache.add(cacheKey);
    return undefined;
  }
  const startEndIndex = startIndex + minChunkLen;
  const stopEndIndex = startIndex + maxChunkLen;
  for (let endIndex = startEndIndex; endIndex <= stopEndIndex; ++endIndex) {
    const chunk = safeSubstring(value, startIndex, endIndex);
    if (arbitraries[arbIndex].canShrinkWithoutContext(chunk)) {
      const rest = tryUnmapJoinedString(
        value,
        endIndex,
        arbitraries,
        arbIndex + 1,
        minLengths,
        maxLengths,
        suffixMinLengths,
        suffixMaxLengths,
        failedCache,
      );
      if (rest !== undefined) {
        return [chunk, ...rest];
      }
    }
  }
  failedCache.add(cacheKey);
  return undefined;
}

/** @internal */
export function partsToJoinedStringUnmapperFor(
  arbitraries: Arbitrary<string>[],
  minLengths: number[],
  maxLengths: number[],
): (value: unknown) => string[] {
  // Precompute suffix sums of min/max lengths
  const n = arbitraries.length;
  const suffixMinLengths: number[] = [];
  const suffixMaxLengths: number[] = [];
  for (let i = 0; i <= n; ++i) {
    suffixMinLengths[i] = 0;
    suffixMaxLengths[i] = 0;
  }
  for (let i = n - 1; i >= 0; --i) {
    suffixMinLengths[i] = suffixMinLengths[i + 1] + minLengths[i];
    const nextMax = suffixMaxLengths[i + 1];
    suffixMaxLengths[i] = nextMax > 0x7fffffff - maxLengths[i] ? 0x7fffffff : nextMax + maxLengths[i];
  }

  return function partsToJoinedStringUnmapper(value: unknown): string[] {
    if (typeof value !== 'string') {
      throw new Error('Unsupported value');
    }
    const result = tryUnmapJoinedString(
      value,
      0,
      arbitraries,
      0,
      minLengths,
      maxLengths,
      suffixMinLengths,
      suffixMaxLengths,
      new Set(),
    );
    if (result === undefined) {
      throw new Error('Unable to unmap the received string');
    }
    return result;
  };
}
