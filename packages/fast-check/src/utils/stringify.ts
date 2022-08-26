import { safeIndexOf, safeJoin, safeMap, safePush, safeToString } from './globals';

const safeJsonStringify = JSON.stringify;

/**
 * Use this symbol to define a custom serializer for your instances.
 * Serializer must be a function returning a string (see {@link WithToStringMethod}).
 *
 * @remarks Since 2.17.0
 * @public
 */
export const toStringMethod = Symbol('fast-check/toStringMethod');
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
export const asyncToStringMethod = Symbol('fast-check/asyncToStringMethod');
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
export function stringifyInternal<Ts>(
  value: Ts,
  previousValues: any[],
  getAsyncContent: (p: Promise<unknown> | WithAsyncToStringMethod) => AsyncContent
): string {
  const currentValues = [...previousValues, value];
  if (typeof value === 'object') {
    // early cycle detection for objects
    if (safeIndexOf(previousValues, value) !== -1) {
      return '[cyclic]';
    }
  }

  if (hasAsyncToStringMethod(value)) {
    // if user defined custom async serialization function, we use it first
    const content = getAsyncContent(value);
    if (content.state === 'fulfilled') {
      return content.value as string;
    }
  }
  if (hasToStringMethod(value)) {
    // if user defined custom sync serialization function, we use it before next ones
    try {
      return value[toStringMethod]();
    } catch (err) {
      // fallback to defaults...
    }
  }

  switch (safeToString(value)) {
    case '[object Array]': {
      const arr = value as unknown as unknown[];
      if (arr.length >= 50 && isSparseArray(arr)) {
        const assignments: string[] = [];
        // Discarded: map then join will still show holes
        // Discarded: forEach is very long on large sparse arrays, but only iterates on non-holes integer keys
        for (const index in arr) {
          if (!Number.isNaN(Number(index)))
            safePush(assignments, `${index}:${stringifyInternal(arr[index], currentValues, getAsyncContent)}`);
        }
        return assignments.length !== 0
          ? `Object.assign(Array(${arr.length}),{${safeJoin(assignments, ',')}})`
          : `Array(${arr.length})`;
      }
      // stringifiedArray results in: '' for [,]
      // stringifiedArray results in: ',' for [,,]
      // stringifiedArray results in: '1,' for [1,,]
      // stringifiedArray results in: '1,,2' for [1,,2]
      const stringifiedArray = safeJoin(
        safeMap(arr, (v) => stringifyInternal(v, currentValues, getAsyncContent)),
        ','
      );
      return arr.length === 0 || arr.length - 1 in arr ? `[${stringifiedArray}]` : `[${stringifiedArray},]`;
    }
    case '[object BigInt]':
      return `${value}n`;
    case '[object Boolean]': {
      // eslint-disable-next-line @typescript-eslint/ban-types
      const unboxedToString = (value as unknown as boolean | Boolean) == true ? 'true' : 'false'; // we rely on implicit unboxing
      return typeof value === 'boolean' ? unboxedToString : `new Boolean(${unboxedToString})`;
    }
    case '[object Date]': {
      const d = value as unknown as Date;
      return Number.isNaN(d.getTime()) ? `new Date(NaN)` : `new Date(${safeJsonStringify(d.toISOString())})`;
    }
    case '[object Map]':
      return `new Map(${stringifyInternal(Array.from(value as any), currentValues, getAsyncContent)})`;
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
            ? `[${stringifyInternal(k, currentValues, getAsyncContent)}]`
            : safeJsonStringify(k)
        }:${stringifyInternal((value as any)[k], currentValues, getAsyncContent)}`;

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
      return `new Set(${stringifyInternal(Array.from(value as any), currentValues, getAsyncContent)})`;
    case '[object String]':
      return typeof value === 'string' ? safeJsonStringify(value) : `new String(${safeJsonStringify(value)})`;
    case '[object Symbol]': {
      const s = value as unknown as symbol;
      if (Symbol.keyFor(s) !== undefined) {
        return `Symbol.for(${safeJsonStringify(Symbol.keyFor(s))})`;
      }
      const desc = getSymbolDescription(s);
      if (desc === null) {
        return 'Symbol()';
      }
      const knownSymbol = desc.startsWith('Symbol.') && (Symbol as any)[desc.substring(7)];
      return s === knownSymbol ? desc : `Symbol(${safeJsonStringify(desc)})`;
    }
    case '[object Promise]': {
      const promiseContent = getAsyncContent(value as any as Promise<unknown>);
      switch (promiseContent.state) {
        case 'fulfilled':
          return `Promise.resolve(${stringifyInternal(promiseContent.value, currentValues, getAsyncContent)})`;
        case 'rejected':
          return `Promise.reject(${stringifyInternal(promiseContent.value, currentValues, getAsyncContent)})`;
        case 'pending':
          return `new Promise(() => {/*pending*/})`;
        case 'unknown':
        default:
          return `new Promise(() => {/*unknown*/})`;
      }
    }
    case '[object Error]':
      if (value instanceof Error) {
        return `new Error(${stringifyInternal(value.message, currentValues, getAsyncContent)})`;
      }
      break;
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
        return `Buffer.from(${stringifyInternal(Array.from(value.values()), currentValues, getAsyncContent)})`;
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
        return `${className}.from(${stringifyInternal(
          Array.from(valuesFromTypedArr),
          currentValues,
          getAsyncContent
        )})`;
      }
      break;
    }
  }

  // default treatment, if none of the above are valid
  try {
    return (value as any).toString();
  } catch {
    return safeToString(value);
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
  const stillPendingMarker = Symbol();
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
        }
      )
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
