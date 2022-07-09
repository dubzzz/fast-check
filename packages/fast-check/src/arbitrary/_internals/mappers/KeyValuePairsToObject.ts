/** @internal */
export function keyValuePairsToObjectMapper<T>(items: [string, T][]): { [key: string]: T } {
  const obj: { [key: string]: T } = {};
  for (const keyValue of items) {
    Object.defineProperty(obj, keyValue[0], {
      enumerable: true,
      configurable: true,
      writable: true,
      value: keyValue[1],
    });
  }
  return obj;
}

/** @internal */
function buildInvalidPropertyNameFilter(obj: unknown): (key: string) => boolean {
  return function invalidPropertyNameFilter(key: string): boolean {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    return (
      descriptor === undefined ||
      !descriptor.configurable ||
      !descriptor.enumerable ||
      !descriptor.writable ||
      descriptor.get !== undefined ||
      descriptor.set !== undefined
    );
  };
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
  if (Object.getOwnPropertySymbols(value).length > 0) {
    throw new Error('Incompatible instance received: should contain symbols');
  }
  if (Object.getOwnPropertyNames(value).find(buildInvalidPropertyNameFilter(value)) !== undefined) {
    throw new Error('Incompatible instance received: should contain only c/e/w properties without get/set');
  }
  return Object.entries(value);
}
