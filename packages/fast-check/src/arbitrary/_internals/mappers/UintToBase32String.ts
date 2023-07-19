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
function getBaseLog(x: number, y: number) {
  return Math.log(y) / Math.log(x);
}

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
export function uintToBase32StringMapper(num: number, paddingLength: number): string {
  if (num === 0) {
    return pad('0', paddingLength);
  }

  let base32Str = '';
  let remaining = num;
  for (let symbolsLeft = Math.floor(getBaseLog(32, num)) + 1; symbolsLeft > 0; symbolsLeft--) {
    const val = Math.pow(32, symbolsLeft - 1);
    const symbol = Math.floor(remaining / val);

    base32Str += encodeSymbol(symbol);
    remaining -= symbol * val;
  }

  return pad(base32Str, paddingLength);
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
    const char = value[index].toUpperCase();
    const numericForChar = decodeSymbolLookupTable[char];
    if (numericForChar === undefined) {
      throw new Error('Unsupported type');
    }
    accumulated += numericForChar * power;
    power *= 32;
  }
  return accumulated;
}
