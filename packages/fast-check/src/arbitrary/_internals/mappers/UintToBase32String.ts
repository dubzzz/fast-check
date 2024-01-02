import { Error, String } from '../../../utils/globals';

/** @internal */
const encodeSymbolLookupTable: Record<number, string> = {
  10: 'A',
  11: 'B',
  12: 'C',
  13: 'D',
  14: 'E',
  15: 'F',
  16: 'G',
  17: 'H',
  18: 'J',
  19: 'K',
  20: 'M',
  21: 'N',
  22: 'P',
  23: 'Q',
  24: 'R',
  25: 'S',
  26: 'T',
  27: 'V',
  28: 'W',
  29: 'X',
  30: 'Y',
  31: 'Z',
};

/** @internal */
const decodeSymbolLookupTable: Record<string, number> = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15,
  G: 16,
  H: 17,
  J: 18,
  K: 19,
  M: 20,
  N: 21,
  P: 22,
  Q: 23,
  R: 24,
  S: 25,
  T: 26,
  V: 27,
  W: 28,
  X: 29,
  Y: 30,
  Z: 31,
};

/** @internal */
function encodeSymbol(symbol: number) {
  return symbol < 10 ? String(symbol) : encodeSymbolLookupTable[symbol];
}

/** @internal */
function pad(value: string, paddingLength: number) {
  let extraPadding = '';
  while (value.length + extraPadding.length < paddingLength) {
    extraPadding += '0';
  }
  return extraPadding + value;
}

/** @internal */
function smallUintToBase32StringMapper(num: number): string {
  let base32Str = '';
  // num must be in 0 (incl.), 0x7fff_ffff (incl.)
  // >>5 is equivalent to /32 and <<5 to x32
  for (let remaining = num; remaining !== 0; ) {
    const next = remaining >> 5;
    const current = remaining - (next << 5);
    base32Str = encodeSymbol(current) + base32Str;
    remaining = next;
  }
  return base32Str;
}

/** @internal */
function uintToBase32StringMapper(num: number, paddingLength: number): string {
  const head = ~~(num / 0x40000000);
  const tail = num & 0x3fffffff;
  return pad(smallUintToBase32StringMapper(head), paddingLength - 6) + pad(smallUintToBase32StringMapper(tail), 6);
}

/** @internal */
export function paddedUintToBase32StringMapper(paddingLength: number) {
  return function padded(num: number): string {
    return uintToBase32StringMapper(num, paddingLength);
  };
}

/** @internal */
export function uintToBase32StringUnmapper(value: unknown): number {
  if (typeof value !== 'string') {
    throw new Error('Unsupported type');
  }

  let accumulated = 0;
  let power = 1;
  for (let index = value.length - 1; index >= 0; --index) {
    const char = value[index];
    const numericForChar = decodeSymbolLookupTable[char];
    if (numericForChar === undefined) {
      throw new Error('Unsupported type');
    }
    accumulated += numericForChar * power;
    power *= 32;
  }
  return accumulated;
}
