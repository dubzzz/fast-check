import {
  safeFilter,
  safeGetTime,
  safeIndexOf,
  safeJoin,
  safeMap,
  safePush,
  safeToISOString,
  safeToString,
  Map,
  String,
  Symbol as StableSymbol,
} from './globals.js';

const safeArrayFrom = Array.from;
const safeBufferIsBuffer = typeof Buffer !== 'undefined' ? Buffer.isBuffer : undefined;
const safeJsonStringify = JSON.stringify;
const safeNumberIsNaN = Number.isNaN;
const safeObjectKeys = Object.keys;
const safeObjectGetOwnPropertySymbols = Object.getOwnPropertySymbols;
const safeObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const safeObjectGetPrototypeOf = Object.getPrototypeOf;
const safeNegativeInfinity = Number.NEGATIVE_INFINITY;
const safePositiveInfinity = Number.POSITIVE_INFINITY;

/**
 * Use this symbol to define a custom serializer for your instances.
 * Serializer must be a function returning a string (see {@link WithToStringMethod}).
 *
 * @remarks Since 2.17.0
 * @public
 */
export const toStringMethod: unique symbol = Symbol.for('fast-check/toStringMethod');
/**
 * Interface to implement for {@link toStringMethod}
 *
 * @remarks Since 2.17.0
 * @public
 */
export type WithToStringMethod = { [toStringMethod]: () => string };
/**
 * Check if an instance implements {@link WithToStringMethod}
 *
 * @remarks Since 2.17.0
 * @public
 */
export function hasToStringMethod<T>(instance: T): instance is T & WithToStringMethod {
  return (
    instance !== null &&
    (typeof instance === 'object' || typeof instance === 'function') &&
    toStringMethod in instance &&
    typeof (instance as any)[toStringMethod] === 'function'
  );
}

/**
 * Use this symbol to define a custom serializer for your instances.
 * Serializer must be a function returning a promise of string (see {@link WithAsyncToStringMethod}).
 *
 * Please note that:
 * 1. It will only be useful for asynchronous properties.
 * 2. It has to return barely instantly.
 *
 * @remarks Since 2.17.0
 * @public
 */
export const asyncToStringMethod: unique symbol = Symbol.for('fast-check/asyncToStringMethod');
/**
 * Interface to implement for {@link asyncToStringMethod}
 *
 * @remarks Since 2.17.0
 * @public
 */
export type WithAsyncToStringMethod = { [asyncToStringMethod]: () => Promise<string> };
/**
 * Check if an instance implements {@link WithAsyncToStringMethod}
 *
 * @remarks Since 2.17.0
 * @public
 */
export function hasAsyncToStringMethod<T>(instance: T): instance is T & WithAsyncToStringMethod {
  return (
    instance !== null &&
    (typeof instance === 'object' || typeof instance === 'function') &&
    asyncToStringMethod in instance &&
    typeof (instance as any)[asyncToStringMethod] === 'function'
  );
}

/** @internal */
const findSymbolNameRegex = /^Symbol\((.*)\)$/;

/** @internal */
type AsyncContent = { state: 'fulfilled' | 'rejected' | 'pending' | 'unknown'; value: unknown };

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
      return 1 / numValue === safeNegativeInfinity ? '-0' : '0';
    case safeNegativeInfinity:
      return 'Number.NEGATIVE_INFINITY';
    case safePositiveInfinity:
      return 'Number.POSITIVE_INFINITY';
    default:
      return numValue === numValue ? String(numValue) : 'Number.NaN';
  }
}

/** @internal */
function isSparseArray(arr: unknown[]): boolean {
  let previousNumberedIndex = -1;
  // eslint-disable-next-line @typescript-eslint/no-for-in-array
  for (const index in arr) {
    const numberedIndex = Number(index);
    if (numberedIndex !== previousNumberedIndex + 1) return true; // we've got a hole
    previousNumberedIndex = numberedIndex;
  }
  return previousNumberedIndex + 1 !== arr.length; // we've got a hole if length does not match
}

/** @internal */
export function stringifyInternal<Ts>(
  value: Ts,
  previousValues: any[],
  getAsyncContent: (p: Promise<unknown> | WithAsyncToStringMethod) => AsyncContent,
): string {
  // Iterative stack-based approach to avoid call stack overflow on deeply nested values.
  // Each stack item is either a literal string (appended to output) or a stringify task.
  type StringifyTask = { value: any; previousValues: any[] };
  type StackItem = string | StringifyTask;

  const resultParts: string[] = [];
  const stack: StackItem[] = [{ value, previousValues }];

  while (stack.length > 0) {
    const item = stack.pop()!;

    // Literal string: append directly to output
    if (typeof item === 'string') {
      resultParts.push(item);
      continue;
    }

    const val = item.value;
    const prevValues = item.previousValues;
    const curValues = [...prevValues, val];

    // Early cycle detection for objects
    if (typeof val === 'object') {
      if (safeIndexOf(prevValues, val) !== -1) {
        resultParts.push('[cyclic]');
        continue;
      }
    }

    // Custom async serialization
    if (hasAsyncToStringMethod(val)) {
      const content = getAsyncContent(val);
      if (content.state === 'fulfilled') {
        resultParts.push(content.value as string);
        continue;
      }
    }
    // Custom sync serialization
    if (hasToStringMethod(val)) {
      try {
        resultParts.push(val[toStringMethod]());
        continue;
      } catch {
        // fallback to defaults...
      }
    }

    const typeStr = safeToString(val);
    let handled = true;

    switch (typeStr) {
      case '[object Array]': {
        const arr = val as unknown as unknown[];
        if (arr.length >= 50 && isSparseArray(arr)) {
          // Sparse array path
          const entries: string[] = [];
          // eslint-disable-next-line @typescript-eslint/no-for-in-array
          for (const index in arr) {
            if (!safeNumberIsNaN(Number(index))) safePush(entries, index);
          }
          if (entries.length === 0) {
            resultParts.push(`Array(${arr.length})`);
          } else {
            // Build items in forward order, push reversed onto stack
            const items: StackItem[] = [`Object.assign(Array(${arr.length}),{`];
            for (let i = 0; i < entries.length; i++) {
              if (i > 0) items.push(',');
              items.push(`${entries[i]}:`);
              items.push({ value: arr[Number(entries[i])], previousValues: curValues });
            }
            items.push('})');
            for (let i = items.length - 1; i >= 0; i--) stack.push(items[i]);
          }
        } else {
          // Regular array path
          // For sparse arrays: holes produce no output between commas, matching Array.map+join behavior
          const suffix = arr.length === 0 || arr.length - 1 in arr ? ']' : ',]';
          const items: StackItem[] = ['['];
          for (let i = 0; i < arr.length; i++) {
            if (i > 0) items.push(',');
            if (i in arr) {
              items.push({ value: arr[i], previousValues: curValues });
            }
          }
          items.push(suffix);
          for (let i = items.length - 1; i >= 0; i--) stack.push(items[i]);
        }
        break;
      }
      case '[object BigInt]':
        resultParts.push(`${val}n`);
        break;
      case '[object Boolean]': {
        // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
        const unboxedToString = (val as unknown as boolean | Boolean) == true ? 'true' : 'false'; // we rely on implicit unboxing
        resultParts.push(typeof val === 'boolean' ? unboxedToString : `new Boolean(${unboxedToString})`);
        break;
      }
      case '[object Date]': {
        const d = val as unknown as Date;
        resultParts.push(
          safeNumberIsNaN(safeGetTime(d)) ? `new Date(NaN)` : `new Date(${safeJsonStringify(safeToISOString(d))})`,
        );
        break;
      }
      case '[object Map]':
        stack.push(')');
        stack.push({ value: Array.from(val as any), previousValues: curValues });
        stack.push('new Map(');
        break;
      case '[object Null]':
        resultParts.push('null');
        break;
      case '[object Number]':
        resultParts.push(
          typeof val === 'number' ? stringifyNumber(val) : `new Number(${stringifyNumber(Number(val))})`,
        );
        break;
      case '[object Object]': {
        try {
          const toStringAccessor = (val as any).toString; // <-- Can throw
          if (typeof toStringAccessor === 'function' && toStringAccessor !== Object.prototype.toString) {
            // Instance (or one of its parent prototypes) overrides the default toString of Object
            resultParts.push((val as any).toString()); // <-- Can throw
            break;
          }
        } catch {
          // Only return what would have been the default toString on Object
          resultParts.push('[object Object]');
          break;
        }

        const items: StackItem[] = ['{'];
        let first = true;

        if (safeObjectGetPrototypeOf(val) === null) {
          items.push('__proto__:null');
          first = false;
        }

        const keys = safeObjectKeys(val as object);
        for (let ki = 0; ki < keys.length; ki++) {
          const k = keys[ki];
          if (!first) items.push(',');
          first = false;
          items.push(
            `${k === '__proto__' ? '["__proto__"]' : safeJsonStringify(k)}:`,
          );
          items.push({ value: (val as any)[k], previousValues: curValues });
        }

        const symbols = safeFilter(safeObjectGetOwnPropertySymbols(val), (s) => {
          const descriptor = safeObjectGetOwnPropertyDescriptor(val, s);
          return descriptor && descriptor.enumerable;
        });
        for (let si = 0; si < symbols.length; si++) {
          const s = symbols[si];
          if (!first) items.push(',');
          first = false;
          items.push('[');
          items.push({ value: s, previousValues: curValues });
          items.push(']:');
          items.push({ value: (val as any)[s], previousValues: curValues });
        }

        items.push('}');
        for (let i = items.length - 1; i >= 0; i--) stack.push(items[i]);
        break;
      }
      case '[object Set]':
        stack.push(')');
        stack.push({ value: Array.from(val as any), previousValues: curValues });
        stack.push('new Set(');
        break;
      case '[object String]':
        resultParts.push(typeof val === 'string' ? safeJsonStringify(val) : `new String(${safeJsonStringify(val)})`);
        break;
      case '[object Symbol]': {
        const s = val as unknown as symbol;
        if (StableSymbol.keyFor(s) !== undefined) {
          resultParts.push(`Symbol.for(${safeJsonStringify(StableSymbol.keyFor(s))})`);
        } else {
          const desc = getSymbolDescription(s);
          if (desc === null) {
            resultParts.push('Symbol()');
          } else {
            const knownSymbol = desc.startsWith('Symbol.') && (StableSymbol as any)[desc.substring(7)];
            resultParts.push(s === knownSymbol ? desc : `Symbol(${safeJsonStringify(desc)})`);
          }
        }
        break;
      }
      case '[object Promise]': {
        const promiseContent = getAsyncContent(val as any as Promise<unknown>);
        switch (promiseContent.state) {
          case 'fulfilled':
            stack.push(')');
            stack.push({ value: promiseContent.value, previousValues: curValues });
            stack.push('Promise.resolve(');
            break;
          case 'rejected':
            stack.push(')');
            stack.push({ value: promiseContent.value, previousValues: curValues });
            stack.push('Promise.reject(');
            break;
          case 'pending':
            resultParts.push('new Promise(() => {/*pending*/})');
            break;
          case 'unknown':
          default:
            resultParts.push('new Promise(() => {/*unknown*/})');
            break;
        }
        break;
      }
      case '[object Error]':
        if (val instanceof Error) {
          stack.push(')');
          stack.push({ value: val.message, previousValues: curValues });
          stack.push('new Error(');
        } else {
          handled = false;
        }
        break;
      case '[object Undefined]':
        resultParts.push('undefined');
        break;
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
        if (typeof safeBufferIsBuffer === 'function' && safeBufferIsBuffer(val)) {
          // Warning: value.values() may crash at runtime if Buffer got poisoned
          // This cast is necessary because `detached` only exists in ES2024,
          // but we target ES2020.
          if ((val.buffer as { detached?: boolean }).detached) {
            // Don't try to access the buffer contents if its underlying
            // `ArrayBuffer` is detached because it will throw.
            resultParts.push('Buffer.from(/*detached ArrayBuffer*/)');
          } else {
            stack.push(')');
            stack.push({ value: safeArrayFrom(val.values()), previousValues: curValues });
            stack.push('Buffer.from(');
          }
          break;
        }
        const valuePrototype = safeObjectGetPrototypeOf(val);
        const className = valuePrototype && valuePrototype.constructor && valuePrototype.constructor.name;
        if (typeof className === 'string') {
          const typedArray = val as unknown as
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
          // This cast is necessary because `detached` only exists in ES2024,
          // but we target ES2020.
          if ((typedArray.buffer as { detached?: boolean }).detached) {
            // Don't try to access the buffer contents if its underlying
            // `ArrayBuffer` is detached because it will throw.
            resultParts.push(`${className}.from(/*detached ArrayBuffer*/)`);
          } else {
            // Warning: typedArray.values() may crash at runtime if type got poisoned
            const valuesFromTypedArr: IterableIterator<bigint | number> = typedArray.values();
            stack.push(')');
            stack.push({ value: safeArrayFrom(valuesFromTypedArr), previousValues: curValues });
            stack.push(`${className}.from(`);
          }
          break;
        }
        handled = false;
        break;
      }
      default:
        handled = false;
        break;
    }

    // Default treatment, if none of the above handled the value
    if (!handled) {
      try {
        resultParts.push((val as any).toString());
      } catch {
        resultParts.push(safeToString(val));
      }
    }
  }

  return safeJoin(resultParts, '');
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
  return stringifyInternal(value, [], () => ({ state: 'unknown', value: undefined }));
}

/**
 * Mid-way between stringify and asyncStringify
 *
 * If the value can be stringified in a synchronous way then it returns a string.
 * Otherwise, it tries to go further in investigations and return a Promise<string>.
 *
 * Not publicly exposed yet!
 *
 * @internal
 */
export function possiblyAsyncStringify<Ts>(value: Ts): string | Promise<string> {
  const stillPendingMarker = StableSymbol();
  const pendingPromisesForCache: Promise<void>[] = [];
  const cache = new Map<unknown, AsyncContent>();

  function createDelay0(): { delay: Promise<typeof stillPendingMarker>; cancel: () => void } {
    let handleId: ReturnType<typeof setTimeout> | null = null;
    const cancel = () => {
      if (handleId !== null) {
        clearTimeout(handleId);
      }
    };
    const delay = new Promise<typeof stillPendingMarker>((resolve) => {
      // setTimeout allows to keep higher priority on any already resolved Promise (or close to)
      // including nested ones like:
      // >  (async () => {
      // >    await Promise.resolve();
      // >    await Promise.resolve();
      // >  })()
      handleId = setTimeout(() => {
        handleId = null;
        resolve(stillPendingMarker);
      }, 0);
    });
    return { delay, cancel };
  }

  const unknownState = { state: 'unknown', value: undefined } as const;
  const getAsyncContent = function getAsyncContent(data: Promise<unknown> | WithAsyncToStringMethod): AsyncContent {
    const cacheKey = data;
    if (cache.has(cacheKey)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return cache.get(cacheKey)!;
    }

    const delay0 = createDelay0();
    const p: Promise<unknown> =
      asyncToStringMethod in data
        ? Promise.resolve().then(() => (data as WithAsyncToStringMethod)[asyncToStringMethod]())
        : (data as Promise<unknown>);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    p.catch(() => {}); // catching potential errors of p to avoid "Unhandled promise rejection"

    pendingPromisesForCache.push(
      // According to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race
      // > If the iterable contains one or more non-promise value and/or an already settled promise,
      // > then Promise.race will resolve to the first of these values found in the iterable.
      Promise.race([p, delay0.delay]).then(
        (successValue) => {
          if (successValue === stillPendingMarker) cache.set(cacheKey, { state: 'pending', value: undefined });
          else cache.set(cacheKey, { state: 'fulfilled', value: successValue });
          delay0.cancel();
        },
        (errorValue) => {
          cache.set(cacheKey, { state: 'rejected', value: errorValue });
          delay0.cancel();
        },
      ),
    );

    cache.set(cacheKey, unknownState);
    return unknownState;
  };

  function loop(): string | Promise<string> {
    // Rq.: While this implementation is not optimal in case we have deeply nested Promise
    //      a single loop (or two) will must of the time be enough for most of the values.
    //      Nested Promise will be a sub-optimal case, but given the fact that it barely never
    //      happens in real world, we may pay the cost for it for time to time.
    const stringifiedValue = stringifyInternal(value, [], getAsyncContent);
    if (pendingPromisesForCache.length === 0) {
      return stringifiedValue;
    }
    return Promise.all(pendingPromisesForCache.splice(0)).then(loop);
  }
  return loop();
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
  return Promise.resolve(possiblyAsyncStringify(value));
}
