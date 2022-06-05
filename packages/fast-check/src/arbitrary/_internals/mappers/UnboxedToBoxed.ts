/** @internal */
export function unboxedToBoxedMapper(value: unknown): unknown {
  switch (typeof value) {
    case 'boolean':
      // tslint:disable-next-line:no-construct
      return new Boolean(value);
    case 'number':
      // tslint:disable-next-line:no-construct
      return new Number(value);
    case 'string':
      // tslint:disable-next-line:no-construct
      return new String(value);
    default:
      return value;
  }
}

/** @internal */
export function unboxedToBoxedUnmapper(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || !('constructor' in value)) {
    return value;
  }
  return value.constructor === Boolean || value.constructor === Number || value.constructor === String
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      (value as Boolean | Number | String).valueOf()
    : value;
}
