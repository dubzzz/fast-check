import { safeGetTime } from '../../../utils/globals';

const SDate = Date;
const SError = Error;

/** @internal */
export function timeToDateMapper(time: number): Date {
  return new SDate(time);
}

/** @internal */
export function timeToDateUnmapper(value: unknown): number {
  if (!(value instanceof SDate) || value.constructor !== SDate) {
    throw new SError('Not a valid value for date unmapper');
  }
  return safeGetTime(value);
}
