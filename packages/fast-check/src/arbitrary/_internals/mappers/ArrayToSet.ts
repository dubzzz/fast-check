/** @internal */
export function arrayToSetMapper<TValue>(data: TValue[]): Set<TValue> {
  return new Set(data);
}

/** @internal */
export function arrayToSetUnmapper<TValue>(value: unknown): TValue[] {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Incompatible instance received: should be a non-null object');
  }
  if (!('constructor' in value) || value.constructor !== Set) {
    throw new Error('Incompatible instance received: should be of exact type Set');
  }
  // Remark: We do not really check for TValue, this will be the responsability of our caller
  // Unmappers are not supposed to inspect to far into the data they receive, they just have to check if the value
  // could have been produced using them: here Array -> Set so if it is a Set then we just return the array.
  return Array.from(value as Set<TValue>);
}
