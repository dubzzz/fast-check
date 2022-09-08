const SBoolean = Boolean;
const SNumber = Number;
const SString = String;

/** @internal */
export function unboxedToBoxedMapper(value: unknown): unknown {
  switch (typeof value) {
    case 'boolean':
      // tslint:disable-next-line:no-construct
      return new SBoolean(value);
    case 'number':
      // tslint:disable-next-line:no-construct
      return new SNumber(value);
    case 'string':
      // tslint:disable-next-line:no-construct
      return new SString(value);
    default:
      return value;
  }
}

/** @internal */
export function unboxedToBoxedUnmapper(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || !('constructor' in value)) {
    return value;
  }
  return value.constructor === SBoolean || value.constructor === SNumber || value.constructor === SString
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      (value as Boolean | Number | String).valueOf()
    : value;
}
