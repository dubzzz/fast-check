/** @internal */
export function keyValuePairsToObjectMapper<T>(items: [string, T][]): { [key: string]: T } {
  // Equivalent to Object.fromEntries
  const obj: { [key: string]: T } = {};
  for (const keyValue of items) {
    obj[keyValue[0]] = keyValue[1];
  }
  return obj;
}
