const safeArrayPush = Array.prototype.push;
const safeArraySort = Array.prototype.sort;

/** Alias for Array.prototype.push */
export const PushSymbol = Symbol('safe.push');
/** Alias for Array.prototype.sort */
export const SortSymbol = Symbol('safe.sort');

/** Array instance enriched with aliased methods that cannot be poisoned */
export type PoisoningFreeArray<T> = Array<T> & {
  [PushSymbol]: (...values: T[]) => void;
  [SortSymbol]: () => T[];
};

/** Alter an instance of Array to include non-poisonable methods */
export function toPoisoningFreeArray<T>(instance: T[]): PoisoningFreeArray<T> {
  Object.defineProperty(instance, PushSymbol, {
    value: safeArrayPush,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  Object.defineProperty(instance, SortSymbol, {
    value: safeArraySort,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  return instance as PoisoningFreeArray<T>;
}
