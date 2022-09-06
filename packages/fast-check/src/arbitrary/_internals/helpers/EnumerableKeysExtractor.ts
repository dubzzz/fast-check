const safeObjectKeys = Object.keys;
const safeObjectGetOwnPropertySymbols = Object.getOwnPropertySymbols;
const safeObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

/** @internal */
export type EnumerableKeyOf<T> = Extract<keyof T, string | symbol>;

/** @internal */
export function extractEnumerableKeys<T extends object>(instance: T): EnumerableKeyOf<T>[] {
  const keys = safeObjectKeys(instance) as EnumerableKeyOf<T>[]; // Only enumerable own properties
  const symbols = safeObjectGetOwnPropertySymbols(instance) as EnumerableKeyOf<T>[];
  for (let index = 0; index !== symbols.length; ++index) {
    const symbol = symbols[index];
    const descriptor = safeObjectGetOwnPropertyDescriptor(instance, symbol);
    if (descriptor && descriptor.enumerable) {
      keys.push(symbol);
    }
  }
  return keys;
}
