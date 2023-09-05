type KeyValuePairs<T> = [string, T][];
type ObjectDefinition<T> = [/*items*/ KeyValuePairs<T>, /*null prototype*/ boolean];

/** @internal */
export function keyValuePairsToObjectMapper<T>(definition: ObjectDefinition<T>): { [key: string]: T } {
  const obj: { [key: string]: T } = definition[1] ? Object.create(null) : {};
  for (const keyValue of definition[0]) {
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
export function keyValuePairsToObjectUnmapper<T>(value: unknown): ObjectDefinition<T> {
  // (partially) Equivalent to Object.entries
  if (typeof value !== 'object' || value === null) {
    throw new Error('Incompatible instance received: should be a non-null object');
  }
  const hasNullPrototype = Object.getPrototypeOf(value) === null;
  const hasObjectPrototype = 'constructor' in value && value.constructor === Object;
  if (!hasNullPrototype && !hasObjectPrototype) {
    throw new Error('Incompatible instance received: should be of exact type Object');
  }
  if (Object.getOwnPropertySymbols(value).length > 0) {
    throw new Error('Incompatible instance received: should contain symbols');
  }
  if (Object.getOwnPropertyNames(value).find(buildInvalidPropertyNameFilter(value)) !== undefined) {
    throw new Error('Incompatible instance received: should contain only c/e/w properties without get/set');
  }
  return [Object.entries(value), hasNullPrototype];
}
