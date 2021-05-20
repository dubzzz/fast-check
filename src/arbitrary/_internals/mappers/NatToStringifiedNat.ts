/** @internal */
export function natToStringifiedNatMapper(options: ['dec' | 'oct' | 'hex', number]): string {
  const [style, v] = options;
  switch (style) {
    case 'oct':
      return `0${Number(v).toString(8)}`;
    case 'hex':
      return `0x${Number(v).toString(16)}`;
    case 'dec':
    default:
      return `${v}`;
  }
}

/** @internal */
export function tryParseStringifiedNat(stringValue: string, radix: number): number {
  const parsedNat = Number.parseInt(stringValue, radix);
  if (parsedNat.toString(radix) !== stringValue) {
    throw new Error('Invalid value');
  }
  return parsedNat;
}

/** @internal */
export function natToStringifiedNatUnmapper(value: unknown): ['dec' | 'oct' | 'hex', number] {
  if (typeof value !== 'string') {
    throw new Error('Invalid type');
  }
  if (value.length >= 2 && value[0] === '0') {
    if (value[1] === 'x') {
      return ['hex', tryParseStringifiedNat(value.substr(2), 16)];
    }
    return ['oct', tryParseStringifiedNat(value.substr(1), 8)];
  }
  return ['dec', tryParseStringifiedNat(value, 10)];
}
