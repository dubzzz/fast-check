import { Date, Error, safeGetTime } from '../../../utils/globals.js';

const safeNaN = Number.NaN;
const safeNumberIsNaN = Number.isNaN;

/** @internal */
export function timeToDateMapper(time: number): Date {
  return new Date(time);
}

/** @internal */
export function timeToDateUnmapper(value: unknown): number {
  if (!(value instanceof Date) || value.constructor !== Date) {
    throw new Error('Not a valid value for date unmapper');
  }
  return safeGetTime(value);
}

/** @internal */
export function timeToDateMapperWithNaN(valueForNaN: number): (time: number) => Date {
  return (time) => {
    return time === valueForNaN ? new Date(safeNaN) : timeToDateMapper(time);
  };
}

/** @internal */
export function timeToDateUnmapperWithNaN(valueForNaN: number): (value: unknown) => number {
  return (value) => {
    const time = timeToDateUnmapper(value);
    return safeNumberIsNaN(time) ? valueForNaN : time;
  };
}
