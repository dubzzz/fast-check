const safeArrayMap = Array.prototype.map;
const safeArrayPush = Array.prototype.push;
const safeArraySort = Array.prototype.sort;
const safeObjectDefineProperty = Object.defineProperty;

/** Alias for Array.prototype.map */
export const MapSymbol = Symbol('safe.map');
/** Alias for Array.prototype.push */
export const PushSymbol = Symbol('safe.push');
/** Alias for Array.prototype.sort */
export const SortSymbol = Symbol('safe.sort');

/** Array instance enriched with aliased methods that cannot be poisoned */
export type PoisoningFreeArray<T> = Array<T> & {
  [MapSymbol]: <U>(mapper: (v: T) => U) => Array<U>;
  [PushSymbol]: (...values: T[]) => void;
  [SortSymbol]: (compare: (keyA: T, keyB: T) => number) => T[];
};

/** Alter an instance of Array to include non-poisonable methods */
export function toPoisoningFreeArray<T>(instance: T[]): PoisoningFreeArray<T> {
  safeObjectDefineProperty(instance, MapSymbol, {
    value: safeArrayMap,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  safeObjectDefineProperty(instance, PushSymbol, {
    value: safeArrayPush,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  safeObjectDefineProperty(instance, SortSymbol, {
    value: safeArraySort,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  return instance as PoisoningFreeArray<T>;
}
