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
  O: 0,
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
function pad(value: string, constLength: number) {
  return (
    Array(constLength - value.length)
      .fill('0')
      .join('') + value
  );
}

/** @internal */
export function uintToBase32StringMapper(num: number, constLength: number | undefined = undefined): string {
  if (num === 0) return pad('0', constLength ?? 1);

  let base32Str = '',
    remaining = num;
  for (let symbolsLeft = Math.floor(getBaseLog(32, num)) + 1; symbolsLeft > 0; symbolsLeft--) {
    const val = Math.pow(32, symbolsLeft - 1);
    const symbol = Math.floor(remaining / val);

    base32Str += encodeSymbol(symbol);
    remaining -= symbol * val;
  }

  return pad(base32Str, constLength ?? base32Str.length);
}

/** @internal */
export function paddedUintToBase32StringMapper(constLength: number) {
  return (num: number): string => uintToBase32StringMapper(num, constLength);
}

/** @internal */
const Base32Regex = /^[0-9A-HJKMNP-TV-Z]+$/;

/** @internal */
export function uintToBase32StringUnmapper(value: unknown): number {
  if (typeof value !== 'string') {
    throw new Error('Unsupported type');
  }

  const normalizedBase32str = value.toUpperCase();
  if (!Base32Regex.test(normalizedBase32str)) {
    throw new Error('Unsupported type');
  }

  const symbols = normalizedBase32str.split('').map((char) => decodeSymbolLookupTable[char]);

  return symbols.reduce((prev, curr, i) => prev + curr * Math.pow(32, symbols.length - 1 - i), 0);
}
