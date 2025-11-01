import { Error, safeEvery } from '../../../utils/globals';

type KeyValuePairs<K extends PropertyKey, V> = [K, V][];
type ObjectDefinition<K extends PropertyKey, V> = [/*items*/ KeyValuePairs<K, V>, /*null prototype*/ boolean];

const safeObjectCreate = Object.create;
const safeObjectDefineProperty = Object.defineProperty;
const safeObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const safeObjectGetPrototypeOf = Object.getPrototypeOf;
const safeReflectOwnKeys = Reflect.ownKeys;

/** @internal */
export function keyValuePairsToObjectMapper<K extends PropertyKey, V>(
  definition: ObjectDefinition<K, V>,
): Record<K, V> {
  const obj: Record<K, V> = definition[1] ? safeObjectCreate(null) : {};
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
function isValidPropertyNameFilter(descriptor: PropertyDescriptor): boolean {
  return (
    descriptor !== undefined &&
    !!descriptor.configurable &&
    !!descriptor.enumerable &&
    !!descriptor.writable &&
    descriptor.get === undefined &&
    descriptor.set === undefined
  );
}

/** @internal */
export function keyValuePairsToObjectUnmapper<K extends PropertyKey, V>(value: unknown): ObjectDefinition<K, V> {
  // (partially) Equivalent to Object.entries
  if (typeof value !== 'object' || value === null) {
    throw new Error('Incompatible instance received: should be a non-null object');
  }
  const hasNullPrototype = safeObjectGetPrototypeOf(value) === null;
  const hasObjectPrototype = 'constructor' in value && value.constructor === Object;
  if (!hasNullPrototype && !hasObjectPrototype) {
    throw new Error('Incompatible instance received: should be of exact type Object');
  }
  const propertyDescriptors = safeReflectOwnKeys(value).map((key): [PropertyKey, PropertyDescriptor] => [
    key,
    // A key returned by `Reflect.ownKeys` must have a descriptor.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    safeObjectGetOwnPropertyDescriptor(value, key)!,
  ]);
  if (!safeEvery(propertyDescriptors, ([, descriptor]) => isValidPropertyNameFilter(descriptor))) {
    throw new Error('Incompatible instance received: should contain only c/e/w properties without get/set');
  }
  return [propertyDescriptors.map(([key, descriptor]) => [key as K, descriptor.value as V]), hasNullPrototype];
}
