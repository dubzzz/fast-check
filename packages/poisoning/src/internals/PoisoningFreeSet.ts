const SSet = Set;
const safeSetAdd = Set.prototype.add;
const safeSetHas = Set.prototype.has;
const safeObjectDefineProperty = Object.defineProperty;

/** Alias for Set.prototype.add */
export const AddSymbol: unique symbol = Symbol('safe.add');
/** Alias for Set.prototype.has */
export const HasSymbol: unique symbol = Symbol('safe.has');

/** Set instance enriched with aliased methods that cannot be poisoned */
export type PoisoningFreeSet<K> = Set<K> & {
  [AddSymbol]: (key: K) => Set<K>;
  [HasSymbol]: (key: K) => boolean;
};

/** Factory responsible to build instances of PoisoningFreeMap */
export function toPoisoningFreeSet<K>(ins?: readonly K[] | Iterable<K> | null): PoisoningFreeSet<K> {
  const instance = new SSet(ins);
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
