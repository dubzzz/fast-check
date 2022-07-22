const safeKeys = Object.keys.bind(Object);
const safeGetOwnPropertySymbols = Object.getOwnPropertySymbols.bind(Object);
const safeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor.bind(Object);

/** @internal */
export type EnumerableKeyOf<T> = Extract<keyof T, string | symbol>;

/** @internal */
export function extractEnumerableKeys<T>(instance: T): EnumerableKeyOf<T>[] {
  const keys = safeKeys(instance) as EnumerableKeyOf<T>[]; // Only enumerable own properties
  const symbols = safeGetOwnPropertySymbols(instance) as EnumerableKeyOf<T>[];
  for (let index = 0; index !== symbols.length; ++index) {
    const symbol = symbols[index];
    const descriptor = safeGetOwnPropertyDescriptor(instance, symbol);
    if (descriptor && descriptor.enumerable) {
      keys.push(symbol);
    }
  }
  return keys;
}
