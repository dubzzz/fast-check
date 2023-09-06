import { Error, safeEvery } from '../../../utils/globals';

type KeyValuePairs<T> = [string, T][];
type ObjectDefinition<T> = [/*items*/ KeyValuePairs<T>, /*null prototype*/ boolean];

const safeObjectCreate = Object.create;
const safeObjectDefineProperty = Object.defineProperty;
const safeObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const safeObjectGetPrototypeOf = Object.getPrototypeOf;
const safeObjectGetOwnPropertySymbols = Object.getOwnPropertySymbols;
const safeObjectGetOwnPropertyNames = Object.getOwnPropertyNames;
const safeObjectEntries = Object.entries;

/** @internal */
export function keyValuePairsToObjectMapper<T>(definition: ObjectDefinition<T>): { [key: string]: T } {
  const obj: { [key: string]: T } = definition[1] ? safeObjectCreate(null) : {};
  for (const keyValue of definition[0]) {
    safeObjectDefineProperty(obj, keyValue[0], {
      enumerable: true,
      configurable: true,
      writable: true,
      value: keyValue[1],
    });
  }
  return obj;
}

/** @internal */
function buildIsValidPropertyNameFilter(obj: unknown): (key: string) => boolean {
  return function isValidPropertyNameFilter(key: string): boolean {
    const descriptor = safeObjectGetOwnPropertyDescriptor(obj, key);
    return (
      descriptor !== undefined &&
      !!descriptor.configurable &&
      !!descriptor.enumerable &&
      !!descriptor.writable &&
      descriptor.get === undefined &&
      descriptor.set === undefined
    );
  };
}

/** @internal */
export function keyValuePairsToObjectUnmapper<T>(value: unknown): ObjectDefinition<T> {
  // (partially) Equivalent to Object.entries
  if (typeof value !== 'object' || value === null) {
    throw new Error('Incompatible instance received: should be a non-null object');
  }
  const hasNullPrototype = safeObjectGetPrototypeOf(value) === null;
  const hasObjectPrototype = 'constructor' in value && value.constructor === Object;
  if (!hasNullPrototype && !hasObjectPrototype) {
    throw new Error('Incompatible instance received: should be of exact type Object');
  }
  if (safeObjectGetOwnPropertySymbols(value).length > 0) {
    throw new Error('Incompatible instance received: should contain symbols');
  }
  if (!safeEvery(safeObjectGetOwnPropertyNames(value), buildIsValidPropertyNameFilter(value))) {
    throw new Error('Incompatible instance received: should contain only c/e/w properties without get/set');
  }
  return [safeObjectEntries(value), hasNullPrototype];
}
