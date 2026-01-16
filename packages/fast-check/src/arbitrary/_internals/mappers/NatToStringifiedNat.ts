import { safeNumberToString, safeSubstring } from '../../../utils/globals.js';

const safeNumberParseInt = Number.parseInt;

/** @internal */
export function natToStringifiedNatMapper(options: ['dec' | 'oct' | 'hex', number]): string {
  const [style, v] = options;
  switch (style) {
    case 'oct':
      return `0${safeNumberToString(v, 8)}`;
    case 'hex':
      return `0x${safeNumberToString(v, 16)}`;
    case 'dec':
    default:
      return `${v}`;
  }
}

/** @internal */
export function tryParseStringifiedNat(stringValue: string, radix: number): number {
  const parsedNat = safeNumberParseInt(stringValue, radix);
  if (safeNumberToString(parsedNat, radix) !== stringValue) {
    throw new Error('Invalid value');
  }
  return parsedNat;
}

/** @internal */
export function natToStringifiedNatUnmapper(value: unknown): ['dec' | 'oct' | 'hex', number] {
  const v = value as string;
  if (v.length >= 2 && v[0] === '0') {
    if (v[1] === 'x') {
      return ['hex', tryParseStringifiedNat(safeSubstring(v, 2), 16)];
    }
    return ['oct', tryParseStringifiedNat(safeSubstring(v, 1), 8)];
  }
  return ['dec', tryParseStringifiedNat(v, 10)];
}
