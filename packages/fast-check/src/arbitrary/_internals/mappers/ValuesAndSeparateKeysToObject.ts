import { safePush } from '../../../utils/globals.js';
import type { EnumerableKeyOf } from '../helpers/EnumerableKeysExtractor.js';

const safeObjectCreate = Object.create;
const safeObjectDefineProperty = Object.defineProperty;
const safeObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const safeObjectGetOwnPropertyNames = Object.getOwnPropertyNames;
const safeObjectGetOwnPropertySymbols = Object.getOwnPropertySymbols;

type OrderedValues<T, TNoKey> = (T[keyof T] | TNoKey)[];
type ObjectDefinition<T, TNoKey> = [/*items*/ OrderedValues<T, TNoKey>, /*null prototype*/ boolean];

/** @internal */
export function buildValuesAndSeparateKeysToObjectMapper<T, TNoKey>(keys: EnumerableKeyOf<T>[], noKeyValue: TNoKey) {
  return function valuesAndSeparateKeysToObjectMapper(
    definition: ObjectDefinition<T, TNoKey>,
  ): Partial<T> & Pick<T, EnumerableKeyOf<T>> {
    const obj: Partial<Record<EnumerableKeyOf<T>, T[keyof T]>> = definition[1] ? safeObjectCreate(null) : {};
    for (let idx = 0; idx !== keys.length; ++idx) {
      const valueWrapper = definition[0][idx];
      if (valueWrapper !== noKeyValue) {
        safeObjectDefineProperty(obj, keys[idx], {
          value: valueWrapper,
          configurable: true,
          enumerable: true,
          writable: true,
        });
      }
    }
    return obj as Partial<T> & Pick<T, EnumerableKeyOf<T>>;
  };
}

/** @internal */
export function buildValuesAndSeparateKeysToObjectUnmapper<T, TNoKey>(keys: EnumerableKeyOf<T>[], noKeyValue: TNoKey) {
  return function valuesAndSeparateKeysToObjectUnmapper(value: unknown): ObjectDefinition<T, TNoKey> {
    if (typeof value !== 'object' || value === null) {
      throw new Error('Incompatible instance received: should be a non-null object');
    }
    const hasNullPrototype = Object.getPrototypeOf(value) === null;
    const hasObjectPrototype = 'constructor' in value && value.constructor === Object;
    if (!hasNullPrototype && !hasObjectPrototype) {
      throw new Error('Incompatible instance received: should be of exact type Object');
    }
    let extractedPropertiesCount = 0;
    const extractedValues: OrderedValues<T, TNoKey> = [];
    for (let idx = 0; idx !== keys.length; ++idx) {
      const descriptor = safeObjectGetOwnPropertyDescriptor(value, keys[idx]);
      if (descriptor !== undefined) {
        if (!descriptor.configurable || !descriptor.enumerable || !descriptor.writable) {
          throw new Error('Incompatible instance received: should contain only c/e/w properties');
        }
        if (descriptor.get !== undefined || descriptor.set !== undefined) {
          throw new Error('Incompatible instance received: should contain only no get/set properties');
        }
        ++extractedPropertiesCount;
        safePush(extractedValues, descriptor.value);
      } else {
        safePush(extractedValues, noKeyValue);
      }
    }
    const namePropertiesCount = safeObjectGetOwnPropertyNames(value).length;
    const symbolPropertiesCount = safeObjectGetOwnPropertySymbols(value).length;
    if (extractedPropertiesCount !== namePropertiesCount + symbolPropertiesCount) {
      throw new Error('Incompatible instance received: should not contain extra properties');
    }
    return [extractedValues, hasNullPrototype];
  };
}
