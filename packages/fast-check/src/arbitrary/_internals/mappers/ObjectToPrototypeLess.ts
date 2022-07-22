const safeAssign = Object.assign.bind(Object);
const safeCreate = Object.create.bind(Object);

/**
 * The received instance MUST be an exact instance of Object, not a sub-class
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/ban-types
export function objectToPrototypeLessMapper(o: object): object {
  return safeAssign(safeCreate(null), o);
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/ban-types
export function objectToPrototypeLessUnmapper(value: unknown): object {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Incompatible instance received: should be a non-null object');
  }
  if ('__proto__' in value) {
    throw new Error('Incompatible instance received: should not have any __proto__');
  }
  return safeAssign({}, value);
}
