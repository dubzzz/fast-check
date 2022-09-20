const SMap = Map;
const safeMapGet = Map.prototype.get;
const safeMapHas = Map.prototype.has;
const safeMapEntries = Map.prototype.entries;
const safeMapSet = Map.prototype.set;
const safeObjectDefineProperty = Object.defineProperty;

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
function toPoisoningFreeMap<K, V>(instance: Map<K, V>): PoisoningFreeMap<K, V> {
  safeObjectDefineProperty(instance, GetSymbol, {
    value: safeMapGet,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  safeObjectDefineProperty(instance, HasSymbol, {
    value: safeMapHas,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  safeObjectDefineProperty(instance, EntriesSymbol, {
    value: safeMapEntries,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  safeObjectDefineProperty(instance, SetSymbol, {
    value: safeMapSet,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  return instance as PoisoningFreeMap<K, V>;
}

/** Factory responsible to build instances of PoisoningFreeMap */
export const PoisoningFreeMap = {
  from<K, V>(ins?: readonly (readonly [K, V])[] | Iterable<readonly [K, V]> | null): PoisoningFreeMap<K, V> {
    return toPoisoningFreeMap(new SMap(ins));
  },
};
