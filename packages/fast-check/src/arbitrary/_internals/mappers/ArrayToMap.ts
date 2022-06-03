/** @internal */
export function arrayToMapMapper<TKey, TValue>(data: [TKey, TValue][]): Map<TKey, TValue> {
  return new Map(data);
}

/** @internal */
export function arrayToMapUnmapper<TKey, TValue>(value: unknown): [TKey, TValue][] {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Incompatible instance received: should be a non-null object');
  }
  if (!('constructor' in value) || value.constructor !== Map) {
    throw new Error('Incompatible instance received: should be of exact type Map');
  }
  // Remark: We do not really check for TValue, this will be the responsability of our caller
  // Unmappers are not supposed to inspect to far into the data they receive, they just have to check if the value
  // could have been produced using them: here Array -> Map so if it is a Map then we just return the array.
  return Array.from(value as Map<TKey, TValue>);
}
