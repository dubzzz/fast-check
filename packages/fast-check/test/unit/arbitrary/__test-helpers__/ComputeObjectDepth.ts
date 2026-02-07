export function computeObjectDepth(o: unknown): number {
  if (o === null || typeof o !== 'object' || o instanceof Boolean || o instanceof Number || o instanceof String) {
    // Not an object (or possibly a boxed value)
    return 0;
  }
  // .keys and .values are defined on normal arrays but will be problematic for arrays containing holes
  // as they also take holes into account
  const values =
    !Array.isArray(o!) && 'values' in o!
      ? [...(o! as { values: () => Iterable<unknown> }).values()]
      : Object.values(o!);
  return 1 + Math.max(...values.map((v) => computeObjectDepth(v)));
}
