/** @internal */
export function keyValuePairsToObjectMapper<T>(items: [string, T][]): { [key: string]: T } {
  // Equivalent to Object.fromEntries
  const obj: { [key: string]: T } = {};
  for (const keyValue of items) {
    obj[keyValue[0]] = keyValue[1];
  }
  return obj;
}

/** @internal */
export function keyValuePairsToObjectUnmapper<T>(value: unknown): [string, T][] {
  // (partially) Equivalent to Object.entries
  if (typeof value !== 'object' || value === null) {
    throw new Error('Incompatible instance received: should be a non-null object');
  }
  if (!('constructor' in value) || value.constructor !== Object) {
    throw new Error('Incompatible instance received: should be of exact type Object');
  }
  return Object.entries(value);
}
