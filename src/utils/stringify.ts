/** @hidden */
function stringifyNumber(numValue: number) {
  switch (numValue) {
    case 0:
      return 1 / numValue === Number.NEGATIVE_INFINITY ? '-0' : '0';
    case Number.NEGATIVE_INFINITY:
      return 'Number.NEGATIVE_INFINITY';
    case Number.POSITIVE_INFINITY:
      return 'Number.POSITIVE_INFINITY';
    default:
      return numValue === numValue ? String(numValue) : 'Number.NaN';
  }
}

/** @hidden */
export function stringify<Ts>(value: Ts): string {
  switch (Object.prototype.toString.call(value)) {
    case '[object Array]':
      return `[${(value as any).map(stringify).join(',')}]`;
    case '[object BigInt]':
      return `${value}n`;
    case '[object Boolean]':
      return typeof value === 'boolean' ? JSON.stringify(value) : `new Boolean(${JSON.stringify(value)})`;
    case '[object Map]':
      return `new Map(${stringify(Array.from(value as any))})`;
    case '[object Null]':
      return `null`;
    case '[object Number]':
      return typeof value === 'number' ? stringifyNumber(value) : `new Number(${stringifyNumber(Number(value))})`;
    case '[object Object]':
      const defaultRepr: string = `${value}`;
      if (defaultRepr !== '[object Object]') return defaultRepr;
      try {
        return (
          '{' +
          Object.keys(value)
            .map(k => `${JSON.stringify(k)}:${stringify((value as any)[k])}`)
            .join(',') +
          '}'
        );
      } catch (err) {
        if (err instanceof RangeError) return '[cyclic]';
        return '[object Object]';
      }
    case '[object Set]':
      return `new Set(${stringify(Array.from(value as any))})`;
    case '[object String]':
      return typeof value === 'string' ? JSON.stringify(value) : `new String(${JSON.stringify(value)})`;
    case '[object Undefined]':
      return `undefined`;
    default:
      try {
        return `${value}`;
      } catch {
        return Object.prototype.toString.call(value);
      }
  }
}
