export function unboxedToBoxedMapper(value: unknown): unknown {
  switch (typeof value) {
    case 'boolean':
      return new Boolean(value);
    case 'number':
      return new Number(value);
    case 'string':
      return new String(value);
    default:
      return value;
  }
}

export function unboxedToBoxedUnmapper(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || !('constructor' in value)) {
    return value;
  }
  return value.constructor === Boolean || value.constructor === Number || value.constructor === String
    ? // oxlint-disable-next-line typescript/no-wrapper-object-types
      (value as Boolean | Number | String).valueOf()
    : value;
}
