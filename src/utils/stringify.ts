/** @internal */
const findSymbolNameRegex = /^Symbol\((.*)\)$/;

/**
 * Only called with symbol produced by Symbol(string | undefined)
 * Not Symbol.for(string)
 * @internal
 */
function getSymbolDescription(s: symbol): string | null {
  if (s.description !== undefined) return s.description;

  // description is always undefined in node 6, 8, 10 (not 12)
  const m = findSymbolNameRegex.exec(String(s));
  // '' considered equivalent to undefined for node <12 (unable to distinguish undefined from '')
  // s.description would have been equal to '' in node 12+
  return m && m[1].length ? m[1] : null;
}

/** @internal */
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

/** @internal */
function isSparseArray(arr: unknown[]): boolean {
  let previousNumberedIndex = -1;
  for (const index in arr) {
    const numberedIndex = Number(index);
    if (numberedIndex !== previousNumberedIndex + 1) return true; // we've got a hole
    previousNumberedIndex = numberedIndex;
  }
  return previousNumberedIndex + 1 !== arr.length; // we've got a hole if length does not match
}

/** @internal */
export function stringifyInternal<Ts>(value: Ts, previousValues: any[]): string {
  const currentValues = previousValues.concat([value]);
  if (typeof value === 'object') {
    // early cycle detection for objects
    if (previousValues.indexOf(value) !== -1) return '[cyclic]';
  }
  switch (Object.prototype.toString.call(value)) {
    case '[object Array]': {
      const arr = value as unknown as unknown[];
      if (arr.length >= 50 && isSparseArray(arr)) {
        const assignments: string[] = [];
        // Discarded: map then join will still show holes
        // Discarded: forEach is very long on large sparse arrays, but only iterates on non-holes integer keys
        for (const index in arr) {
          if (!Number.isNaN(Number(index)))
            assignments.push(`${index}:${stringifyInternal(arr[index], currentValues)}`);
        }
        return assignments.length !== 0
          ? `Object.assign(Array(${arr.length}),{${assignments.join(',')}})`
          : `Array(${arr.length})`;
      }
      // stringifiedArray results in: '' for [,]
      // stringifiedArray results in: ',' for [,,]
      // stringifiedArray results in: '1,' for [1,,]
      // stringifiedArray results in: '1,,2' for [1,,2]
      const stringifiedArray = arr.map((v) => stringifyInternal(v, currentValues)).join(',');
      return arr.length === 0 || arr.length - 1 in arr ? `[${stringifiedArray}]` : `[${stringifiedArray},]`;
    }
    case '[object BigInt]':
      return `${value}n`;
    case '[object Boolean]':
      return typeof value === 'boolean' ? JSON.stringify(value) : `new Boolean(${JSON.stringify(value)})`;
    case '[object Date]': {
      const d = value as unknown as Date;
      return Number.isNaN(d.getTime()) ? `new Date(NaN)` : `new Date(${JSON.stringify(d.toISOString())})`;
    }
    case '[object Map]':
      return `new Map(${stringifyInternal(Array.from(value as any), currentValues)})`;
    case '[object Null]':
      return `null`;
    case '[object Number]':
      return typeof value === 'number' ? stringifyNumber(value) : `new Number(${stringifyNumber(Number(value))})`;
    case '[object Object]': {
      try {
        const toStringAccessor = (value as any).toString; // <-- Can throw
        if (typeof toStringAccessor === 'function' && toStringAccessor !== Object.prototype.toString) {
          // Instance (or one of its parent prototypes) overrides the default toString of Object
          return (value as any).toString(); // <-- Can throw
        }
      } catch (err) {
        // Only return what would have been the default toString on Object
        return '[object Object]';
      }

      const mapper = (k: string | symbol) =>
        `${
          k === '__proto__'
            ? '["__proto__"]'
            : typeof k === 'symbol'
            ? `[${stringifyInternal(k, currentValues)}]`
            : JSON.stringify(k)
        }:${stringifyInternal((value as any)[k], currentValues)}`;

      const stringifiedProperties = [
        ...Object.keys(value).map(mapper),
        ...Object.getOwnPropertySymbols(value)
          .filter((s) => {
            const descriptor = Object.getOwnPropertyDescriptor(value, s);
            return descriptor && descriptor.enumerable;
          })
          .map(mapper),
      ];
      const rawRepr = '{' + stringifiedProperties.join(',') + '}';

      if (Object.getPrototypeOf(value) === null) {
        return rawRepr === '{}' ? 'Object.create(null)' : `Object.assign(Object.create(null),${rawRepr})`;
      }
      return rawRepr;
    }
    case '[object Set]':
      return `new Set(${stringifyInternal(Array.from(value as any), currentValues)})`;
    case '[object String]':
      return typeof value === 'string' ? JSON.stringify(value) : `new String(${JSON.stringify(value)})`;
    case '[object Symbol]': {
      const s = value as unknown as symbol;
      if (Symbol.keyFor(s) !== undefined) {
        return `Symbol.for(${JSON.stringify(Symbol.keyFor(s))})`;
      }
      const desc = getSymbolDescription(s);
      if (desc === null) {
        return 'Symbol()';
      }
      const knownSymbol = desc.startsWith('Symbol.') && (Symbol as any)[desc.substring(7)];
      return s === knownSymbol ? desc : `Symbol(${JSON.stringify(desc)})`;
    }
    case '[object Undefined]':
      return `undefined`;
    case '[object Int8Array]':
    case '[object Uint8Array]':
    case '[object Uint8ClampedArray]':
    case '[object Int16Array]':
    case '[object Uint16Array]':
    case '[object Int32Array]':
    case '[object Uint32Array]':
    case '[object Float32Array]':
    case '[object Float64Array]':
    case '[object BigInt64Array]':
    case '[object BigUint64Array]': {
      if (typeof Buffer !== 'undefined' && typeof Buffer.isBuffer === 'function' && Buffer.isBuffer(value)) {
        return `Buffer.from(${stringifyInternal(Array.from(value.values()), currentValues)})`;
      }
      const valuePrototype = Object.getPrototypeOf(value);
      const className = valuePrototype && valuePrototype.constructor && valuePrototype.constructor.name;
      if (typeof className === 'string') {
        const typedArray = value as unknown as
          | Int8Array
          | Uint8Array
          | Uint8ClampedArray
          | Int16Array
          | Uint16Array
          | Int32Array
          | Uint32Array
          | Float32Array
          | Float64Array
          | BigInt64Array
          | BigUint64Array;
        const valuesFromTypedArr: IterableIterator<bigint | number> = typedArray.values();
        return `${className}.from(${stringifyInternal(Array.from(valuesFromTypedArr), currentValues)})`;
      }
      break;
    }
  }

  // default treatment, if none of the above are valid
  try {
    return (value as any).toString();
  } catch {
    return Object.prototype.toString.call(value);
  }
}

/**
 * Convert any value to its fast-check string representation
 *
 * @param value - Value to be converted into a string
 *
 * @remarks Since 1.15.0
 * @public
 */
export function stringify<Ts>(value: Ts): string {
  return stringifyInternal(value, []);
}

/**
 * Convert any value to its fast-check string representation
 *
 * This asynchronous version is also able to dig into the status of Promise
 *
 * @param value - Value to be converted into a string
 *
 * @remarks Since 2.17.0
 * @public
 */
export async function asyncStringify<Ts>(value: Ts): Promise<string> {
  return stringifyInternal(value, []);
}
