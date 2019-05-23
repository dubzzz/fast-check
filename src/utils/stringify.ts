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
export function stringifyInternal<Ts>(value: Ts, previousValues: any[]): string {
  const currentValues = previousValues.concat([value]);
  if (typeof value === 'object') {
    // early cycle detection for objects
    if (previousValues.indexOf(value) !== -1) return '[cyclic]';
  }
  switch (Object.prototype.toString.call(value)) {
    case '[object Array]':
      return `[${(value as any).map((v: any) => stringifyInternal(v, currentValues)).join(',')}]`;
    case '[object BigInt]':
      return `${value}n`;
    case '[object Boolean]':
      return typeof value === 'boolean' ? JSON.stringify(value) : `new Boolean(${JSON.stringify(value)})`;
    case '[object Map]':
      return `new Map(${stringifyInternal(Array.from(value as any), currentValues)})`;
    case '[object Null]':
      return `null`;
    case '[object Number]':
      return typeof value === 'number' ? stringifyNumber(value) : `new Number(${stringifyNumber(Number(value))})`;
    case '[object Object]':
      try {
        const defaultRepr: string = value.toString();
        if (defaultRepr !== '[object Object]') return defaultRepr;
        return (
          '{' +
          Object.keys(value)
            .map(k => `${JSON.stringify(k)}:${stringifyInternal((value as any)[k], currentValues)}`)
            .join(',') +
          '}'
        );
      } catch (err) {
        return '[object Object]';
      }
    case '[object Set]':
      return `new Set(${stringifyInternal(Array.from(value as any), currentValues)})`;
    case '[object String]':
      return typeof value === 'string' ? JSON.stringify(value) : `new String(${JSON.stringify(value)})`;
    case '[object Symbol]':
      const s = (value as unknown) as symbol;
      if (Symbol.keyFor(s) !== undefined) {
        return `Symbol.for(${JSON.stringify(Symbol.keyFor(s))})`;
      }
      return s.description !== undefined ? `Symbol(${JSON.stringify(s.description)})` : `Symbol()`;
    case '[object Undefined]':
      return `undefined`;
    default:
      try {
        return value.toString();
      } catch {
        return Object.prototype.toString.call(value);
      }
  }
}

/**
 * Convert any value to its fast-check string representation
 * @param value Value to be converted into a string
 */
export function stringify<Ts>(value: Ts): string {
  return stringifyInternal(value, []);
}
