import { safeNumberToString, safePadStart } from '../../../utils/globals';

/** @internal */
export function numberToPaddedEightMapper(n: number): string {
  return safePadStart(safeNumberToString(n, 16), 8, '0');
}

/** @internal */
export function numberToPaddedEightUnmapper(value: unknown): number {
  if (typeof value !== 'string') {
    throw new Error('Unsupported type');
  }
  if (value.length !== 8) {
    throw new Error('Unsupported value: invalid length');
  }
  const n = parseInt(value, 16);
  if (value !== numberToPaddedEightMapper(n)) {
    throw new Error('Unsupported value: invalid content');
  }
  return n;
}
