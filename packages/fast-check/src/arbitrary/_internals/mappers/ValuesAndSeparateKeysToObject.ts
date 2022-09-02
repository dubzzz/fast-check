import { safePush } from '../../../utils/globals';
import { EnumerableKeyOf } from '../helpers/EnumerableKeysExtractor';

const safeObjectDefineProperty = Object.defineProperty;
const safeObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const safeObjectGetOwnPropertyNames = Object.getOwnPropertyNames;
const safeObjectGetOwnPropertySymbols = Object.getOwnPropertySymbols;

/** @internal */
export function buildValuesAndSeparateKeysToObjectMapper<T, TNoKey>(keys: EnumerableKeyOf<T>[], noKeyValue: TNoKey) {
  return function valuesAndSeparateKeysToObjectMapper(
    gs: (T[keyof T] | TNoKey)[]
  ): Partial<T> & Pick<T, EnumerableKeyOf<T>> {
    const obj: Partial<Record<EnumerableKeyOf<T>, T[keyof T]>> = {};
    for (let idx = 0; idx !== keys.length; ++idx) {
      const valueWrapper = gs[idx];
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
  return function valuesAndSeparateKeysToObjectUnmapper(value: unknown): (T[keyof T] | TNoKey)[] {
    if (typeof value !== 'object' || value === null) {
      throw new Error('Incompatible instance received: should be a non-null object');
    }
    if (!('constructor' in value) || value.constructor !== Object) {
      throw new Error('Incompatible instance received: should be of exact type Object');
    }
    let extractedPropertiesCount = 0;
    const extractedValues: (T[keyof T] | TNoKey)[] = [];
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
    return extractedValues;
  };
}
