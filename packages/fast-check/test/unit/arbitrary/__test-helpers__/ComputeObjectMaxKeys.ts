export function computeObjectMaxKeys(o: unknown): number {
  if (o === null || typeof o !== 'object' || o instanceof Boolean || o instanceof Number || o instanceof String) {
    // Not an object (or possibly a boxed value)
    return 0;
  }
  if (
    o instanceof Int8Array ||
    o instanceof Uint8Array ||
    o instanceof Uint8ClampedArray ||
    o instanceof Int16Array ||
    o instanceof Uint16Array ||
    o instanceof Int32Array ||
    o instanceof Uint32Array ||
    o instanceof Float32Array ||
    o instanceof Float64Array
  ) {
    // Internal convention of our arbitrary of anaything:
    // typed arrays do not follow the constraint maxKeys (as strings)
    return 0;
  }
  // .keys and .values are defined on normal arrays but will be problematic for arrays containing holes
  // as they also take holes into account
  const keys =
    !Array.isArray(o!) && 'keys' in o! ? [...(o! as { keys: () => Iterable<unknown> }).keys()] : Object.keys(o!);
  const values =
    !Array.isArray(o!) && 'values' in o!
      ? [...(o! as { values: () => Iterable<unknown> }).values()]
      : Object.values(o!);
  return Math.max(
    keys.length,
    ...keys.map((v) => computeObjectMaxKeys(v)),
    ...values.map((v) => computeObjectMaxKeys(v))
  );
}
