import { safeNumberToString, safePadStart } from '../../../utils/globals.js';

/** @internal */
export function numberToPaddedEightMapper(n: number): string {
  return safePadStart(safeNumberToString(n, 16), 8, '0');
}

/** @internal */
export function numberToPaddedEightUnmapper(value: unknown): number {
  const v = value as string;
  if (v.length !== 8) {
    throw new Error('Unsupported value: invalid length');
  }
  const n = parseInt(v, 16);
  if (v !== numberToPaddedEightMapper(n)) {
    throw new Error('Unsupported value: invalid content');
  }
  return n;
}
