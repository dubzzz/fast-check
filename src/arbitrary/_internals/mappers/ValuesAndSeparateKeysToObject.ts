import { EnumerableKeyOf } from '../helpers/EnumerableKeysExtractor';

/** @internal */
export function buildValuesAndSeparateKeysToObjectMapper<T, TNoKey>(keys: EnumerableKeyOf<T>[], noKeyValue: TNoKey) {
  return function valuesAndSeparateKeysToObjectMapper(
    gs: (T[keyof T] | TNoKey)[]
  ): Partial<T> & Pick<T, EnumerableKeyOf<T>> {
    const obj: Partial<Record<EnumerableKeyOf<T>, T[keyof T]>> = {};
    for (let idx = 0; idx !== keys.length; ++idx) {
      const valueWrapper = gs[idx];
      if (valueWrapper !== noKeyValue) {
        obj[keys[idx]] = valueWrapper as T[keyof T]; // not TNoKey
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
      const descriptor = Object.getOwnPropertyDescriptor(value, keys[idx]);
      if (descriptor !== undefined) {
        if (!descriptor.configurable || !descriptor.enumerable || !descriptor.writable) {
          throw new Error('Incompatible instance received: should contain only c/e/w properties');
        }
        if (descriptor.get !== undefined || descriptor.set !== undefined) {
          throw new Error('Incompatible instance received: should contain only no get/set properties');
        }
        ++extractedPropertiesCount;
        extractedValues.push(descriptor.value);
      } else {
        extractedValues.push(noKeyValue);
      }
    }
    const namePropertiesCount = Object.getOwnPropertyNames(value).length;
    const symbolPropertiesCount = Object.getOwnPropertySymbols(value).length;
    if (extractedPropertiesCount !== namePropertiesCount + symbolPropertiesCount) {
      throw new Error('Incompatible instance received: should not contain extra properties');
    }
    return extractedValues;
  };
}
