const safeArrayFrom = Array.from;
const safeArrayMap = Array.prototype.map;
const safeArrayPush = Array.prototype.push;
const safeArrayShift = Array.prototype.shift;
const safeArraySort = Array.prototype.sort;
const safeObjectDefineProperty = Object.defineProperty;

/** Alias for Array.prototype.map */
export const MapSymbol: unique symbol = Symbol('safe.map');
/** Alias for Array.prototype.push */
export const PushSymbol: unique symbol = Symbol('safe.push');
/** Alias for Array.prototype.shift */
export const ShiftSymbol: unique symbol = Symbol('safe.shift');
/** Alias for Array.prototype.sort */
export const SortSymbol: unique symbol = Symbol('safe.sort');

/** Array instance enriched with aliased methods that cannot be poisoned */
export type PoisoningFreeArray<T> = Array<T> & {
  [MapSymbol]: <U>(mapper: (v: T) => U) => Array<U>;
  [PushSymbol]: (...values: T[]) => void;
  [ShiftSymbol]: () => T | undefined;
  [SortSymbol]: (compare: (keyA: T, keyB: T) => number) => T[];
};

/** Alter an instance of Array to include non-poisonable methods */
function toPoisoningFreeArray<T>(instance: T[]): PoisoningFreeArray<T> {
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
  safeObjectDefineProperty(instance, ShiftSymbol, {
    value: safeArrayShift,
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

/** Factory responsible to build instances of PoisoningFreeArray */
export const PoisoningFreeArray = {
  from<T>(arrayLike: ArrayLike<T>): PoisoningFreeArray<T> {
    return toPoisoningFreeArray(safeArrayFrom(arrayLike));
  },
};
