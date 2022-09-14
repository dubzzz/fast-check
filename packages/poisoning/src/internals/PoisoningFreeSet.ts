const SSet = Set;
const safeSetAdd = Set.prototype.add;
const safeSetHas = Set.prototype.has;
const safeObjectDefineProperty = Object.defineProperty;

/** Alias for Set.prototype.add */
export const AddSymbol = Symbol('safe.add');
/** Alias for Set.prototype.has */
export const HasSymbol = Symbol('safe.has');

/** Set instance enriched with aliased methods that cannot be poisoned */
export type PoisoningFreeSet<K> = Set<K> & {
  [AddSymbol]: (key: K) => Set<K>;
  [HasSymbol]: (key: K) => boolean;
};

/** Alter an instance of Set to include non-poisonable methods */
function toPoisoningFreeSet<K>(instance: Set<K>): PoisoningFreeSet<K> {
  safeObjectDefineProperty(instance, AddSymbol, {
    value: safeSetAdd,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  safeObjectDefineProperty(instance, HasSymbol, {
    value: safeSetHas,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  return instance as PoisoningFreeSet<K>;
}

/** Factory responsible to build instances of PoisoningFreeMap */
export const PoisoningFreeSet = {
  from<K>(ins?: readonly K[] | Iterable<K> | null): PoisoningFreeSet<K> {
    return toPoisoningFreeSet(new SSet(ins));
  },
};
