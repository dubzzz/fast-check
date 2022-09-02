import { safeGetTime } from '../../../utils/globals';

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
