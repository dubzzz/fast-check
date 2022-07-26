const safeMapGet = Map.prototype.get;
const safeMapHas = Map.prototype.has;
const safeMapEntries = Map.prototype.entries;
const safeMapSet = Map.prototype.set;

/** Alias for Map.prototype.get */
export const GetSymbol = Symbol('safe.get');
/** Alias for Map.prototype.has */
export const HasSymbol = Symbol('safe.has');
/** Alias for Map.prototype.entries */
export const EntriesSymbol = Symbol('safe.entries');
/** Alias for Map.prototype.set */
export const SetSymbol = Symbol('safe.set');

/** Map instance enriched with aliased methods that cannot be poisoned */
export type PoisoningFreeMap<K, V> = Map<K, V> & {
  [GetSymbol]: (key: K) => V | undefined;
  [HasSymbol]: (key: K) => boolean;
  [EntriesSymbol]: () => IterableIterator<[K, V]>;
  [SetSymbol]: (key: K, value: V) => Map<K, V>;
};

/** Alter an instance of Map to include non-poisonable methods */
export function toPoisoningFreeMap<K, V>(instance: Map<K, V>): PoisoningFreeMap<K, V> {
  Object.defineProperty(instance, GetSymbol, {
    value: safeMapGet,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  Object.defineProperty(instance, HasSymbol, {
    value: safeMapHas,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  Object.defineProperty(instance, EntriesSymbol, {
    value: safeMapEntries,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  Object.defineProperty(instance, SetSymbol, {
    value: safeMapSet,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  return instance as PoisoningFreeMap<K, V>;
}
