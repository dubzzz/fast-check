/** @internal */
export type EnumerableKeyOf<T> = Extract<keyof T, string | symbol>;

/** @internal */
export function extractEnumerableKeys<T>(instance: T): EnumerableKeyOf<T>[] {
  const keys = Object.keys(instance) as EnumerableKeyOf<T>[]; // Only enumerable own properties
  const symbols = Object.getOwnPropertySymbols(instance) as EnumerableKeyOf<T>[];
  for (let index = 0; index !== symbols.length; ++index) {
    const symbol = symbols[index];
    const descriptor = Object.getOwnPropertyDescriptor(instance, symbol);
    if (descriptor && descriptor.enumerable) {
      keys.push(symbol);
    }
  }
  return keys;
}
