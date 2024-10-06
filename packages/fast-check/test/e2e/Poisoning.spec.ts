import { describe, it, expect } from 'vitest';
import * as fc from '../../src/fast-check';
import { seed } from './seed';
import { type } from 'os';

const safeObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const safeObjectDefineProperty = Object.defineProperty;

// Building the matcher in a polluted context is not working for now
const preBuiltStringMatching = fc.stringMatching(/(^|\s)[0-9a-f]{8}-(\w{4})[^abc][^a-u]\D+(\s|$)/);

describe(`Poisoning (seed: ${seed})`, () => {
  if (type() === 'Darwin') {
    // Skip Poisoning related tests on MacOS
    it('No test for Darwin', () => {});
    return;
  }

  it.each<{
    name: string;
    arbitraryBuilder: () => fc.Arbitrary<unknown>;
  }>([
    { name: 'noop', arbitraryBuilder: () => noop() },
    { name: 'noop::chain', arbitraryBuilder: () => noop().chain(() => noop()) },
    { name: 'noop::filter', arbitraryBuilder: () => noop().filter(() => true) },
    { name: 'noop::map', arbitraryBuilder: () => noop().map((v) => v) },
    { name: 'basic', arbitraryBuilder: () => basic() },
    // Boolean
    { name: 'boolean', arbitraryBuilder: () => fc.boolean() },
    // Numeric
    { name: 'integer', arbitraryBuilder: () => fc.integer() },
    { name: 'nat', arbitraryBuilder: () => fc.nat() },
    { name: 'maxSafeInteger', arbitraryBuilder: () => fc.maxSafeInteger() },
    { name: 'maxSafeNat', arbitraryBuilder: () => fc.maxSafeNat() },
    { name: 'float', arbitraryBuilder: () => fc.float() },
    // pure-rand is not resilient to prototype poisoning occuring on Array
    //{ name: 'double', arbitraryBuilder: () => fc.double() },
    { name: 'bigIntN', arbitraryBuilder: () => fc.bigIntN(64) },
    { name: 'bigInt', arbitraryBuilder: () => fc.bigInt() },
    { name: 'bigUintN', arbitraryBuilder: () => fc.bigUintN(64) },
    { name: 'bigUint', arbitraryBuilder: () => fc.bigUint() },
    // String
    // : Single character
    { name: 'char', arbitraryBuilder: () => fc.char() },
    // : Multiple characters
    { name: 'base64String', arbitraryBuilder: () => fc.base64String() },
    { name: 'string', arbitraryBuilder: () => fc.string() },
    { name: 'stringMatching', arbitraryBuilder: () => preBuiltStringMatching },
    // : More specific strings
    // related to fc.double: pure-rand is not resilient to prototype poisoning occuring on Array
    //{ name: 'json', arbitraryBuilder: () => fc.json() },
    { name: 'lorem', arbitraryBuilder: () => fc.lorem() },
    { name: 'ipV4', arbitraryBuilder: () => fc.ipV4() },
    { name: 'ipV4Extended', arbitraryBuilder: () => fc.ipV4Extended() },
    { name: 'ipV6', arbitraryBuilder: () => fc.ipV6() },
    { name: 'ulid', arbitraryBuilder: () => fc.ulid() },
    { name: 'uuid', arbitraryBuilder: () => fc.uuid() },
    { name: 'domain', arbitraryBuilder: () => fc.domain() },
    { name: 'webAuthority', arbitraryBuilder: () => fc.webAuthority() },
    { name: 'webFragments', arbitraryBuilder: () => fc.webFragments() },
    { name: 'webQueryParameters', arbitraryBuilder: () => fc.webQueryParameters() },
    { name: 'webSegment', arbitraryBuilder: () => fc.webSegment() },
    { name: 'webPath', arbitraryBuilder: () => fc.webPath() },
    { name: 'webUrl', arbitraryBuilder: () => fc.webUrl() },
    { name: 'emailAddress', arbitraryBuilder: () => fc.emailAddress() },
    { name: 'mixedCase', arbitraryBuilder: () => fc.mixedCase(fc.string()) },
    // Date
    { name: 'date', arbitraryBuilder: () => fc.date() },
    // Typed Array
    { name: 'int8Array', arbitraryBuilder: () => fc.int8Array() },
    { name: 'uint8Array', arbitraryBuilder: () => fc.uint8Array() },
    { name: 'uint8ClampedArray', arbitraryBuilder: () => fc.uint8ClampedArray() },
    { name: 'int16Array', arbitraryBuilder: () => fc.int16Array() },
    { name: 'uint16Array', arbitraryBuilder: () => fc.uint16Array() },
    { name: 'int32Array', arbitraryBuilder: () => fc.int32Array() },
    { name: 'uint32Array', arbitraryBuilder: () => fc.uint32Array() },
    { name: 'float32Array', arbitraryBuilder: () => fc.float32Array() },
    // related to fc.double: pure-rand is not resilient to prototype poisoning occuring on Array
    //{ name: 'float64Array', arbitraryBuilder: () => fc.float64Array() },
    { name: 'bigInt64Array', arbitraryBuilder: () => fc.bigInt64Array() },
    { name: 'bigUint64Array', arbitraryBuilder: () => fc.bigUint64Array() },
    // Combinators
    // : Simple
    { name: 'constant', arbitraryBuilder: () => fc.constant(1) },
    { name: 'constantFrom', arbitraryBuilder: () => fc.constantFrom(1, 2, 3) },
    { name: 'option', arbitraryBuilder: () => fc.option(noop()) },
    { name: 'oneof', arbitraryBuilder: () => fc.oneof(noop(), noop()) },
    { name: 'mapToConstant', arbitraryBuilder: () => fc.mapToConstant(mapToConstantEntry(0), mapToConstantEntry(100)) },
    { name: 'clone', arbitraryBuilder: () => fc.clone(noop(), 2) },
    // : Array
    { name: 'tuple', arbitraryBuilder: () => fc.tuple(noop(), noop()) },
    { name: 'array', arbitraryBuilder: () => fc.array(noop()) },
    { name: 'uniqueArray', arbitraryBuilder: () => fc.uniqueArray(basic()) },
    { name: 'uniqueArray::SameValueZero', arbitraryBuilder: () => fc.uniqueArray(basic(), CmpSameValueZero) },
    { name: 'uniqueArray::IsStrictlyEqual', arbitraryBuilder: () => fc.uniqueArray(basic(), CmpIsStrictlyEqual) },
    { name: 'uniqueArray::Custom', arbitraryBuilder: () => fc.uniqueArray(basic(), { comparator: (a, b) => a === b }) },
    { name: 'subarray', arbitraryBuilder: () => fc.subarray([1, 2, 3, 4, 5]) },
    { name: 'shuffledSubarray', arbitraryBuilder: () => fc.shuffledSubarray([1, 2, 3, 4, 5]) },
    { name: 'sparseArray', arbitraryBuilder: () => fc.sparseArray(noop()) },
    { name: 'infiniteStream', arbitraryBuilder: () => fc.infiniteStream(noop()) },
    // : Object
    { name: 'dictionary', arbitraryBuilder: () => fc.dictionary(basic().map(String), noop()) },
    { name: 'record', arbitraryBuilder: () => fc.record({ a: noop(), b: noop() }) },
    { name: 'record::requiredKeys', arbitraryBuilder: () => fc.record({ a: noop(), b: noop() }, { requiredKeys: [] }) },
    // related to fc.double: pure-rand is not resilient to prototype poisoning occuring on Array
    //{ name: 'object', arbitraryBuilder: () => fc.object() },
    //{ name: 'jsonValue', arbitraryBuilder: () => fc.jsonValue() },
    //{ name: 'anything', arbitraryBuilder: () => fc.anything() },
    // : Function
    { name: 'compareBooleanFunc', arbitraryBuilder: () => fc.compareBooleanFunc() },
    { name: 'compareFunc', arbitraryBuilder: () => fc.compareFunc() },
    { name: 'func', arbitraryBuilder: () => fc.func(noop()) },
    // : Recursive structures
    { name: 'letrec', arbitraryBuilder: () => letrecTree() },
    { name: 'memo', arbitraryBuilder: () => memoTree() },
  ])('should not be impacted by altered globals when using $name', ({ arbitraryBuilder }) => {
    // Arrange
    let runId = 0;
    let failedOnce = false;
    const resultStream = fc.sample(fc.infiniteStream(fc.boolean()), { seed, numRuns: 1 })[0];
    const testResult = (): boolean => {
      if (++runId === 100 && !failedOnce) {
        // Force a failure for the 100th execution if we never encountered any before
        // Otherwise it would make fc.assert green as the property never failed
        return false;
      }
      const ret = resultStream.next().value;
      failedOnce = failedOnce || !ret;
      return ret;
    };
    const restoreAll = dropMainGlobals();

    // Act
    let interceptedException: unknown = undefined;
    try {
      fc.assert(
        fc.property(arbitraryBuilder(), (_v) => testResult()),
        { seed },
      );
    } catch (err) {
      interceptedException = err;
    }

    // Assert
    restoreAll(); // Restore globals before running real checks
    expect(interceptedException).toBeDefined();
    expect(interceptedException).toBeInstanceOf(Error);
    expect((interceptedException as Error).message).toMatch(/Property failed after/);
  });
});

// Helpers

const capturedGlobalThis = globalThis;
const own = Object.getOwnPropertyNames;
function dropAllFromObj(obj: unknown): (() => void)[] {
  const restores: (() => void)[] = [];
  for (const k of own(obj)) {
    // We need to keep String for Jest to be able to run properly
    // and Object because of some code generated by TypeScript in the cjs version
    if (obj === capturedGlobalThis && (k === 'String' || k === 'Object')) {
      continue;
    }
    try {
      const descriptor = safeObjectGetOwnPropertyDescriptor(obj, k)!;
      delete (obj as any)[k];
      restores.push(() => safeObjectDefineProperty(obj, k, descriptor));
    } catch {
      // Object.prototype cannot be deleted, and others might too
    }
  }
  return restores;
}
function dropMainGlobals(): () => void {
  const mainGlobals = [
    Object,
    Function,
    //Array, // TypeError: originalEmit.apply is not a function
    Number,
    Boolean,
    String,
    Symbol,
    Date,
    Promise,
    RegExp,
    Error,
    Map,
    BigInt,
    Set,
    WeakMap,
    WeakSet,
    Proxy,
    Reflect,
    Buffer,
    ArrayBuffer,
    SharedArrayBuffer,
    Uint8Array,
    Int8Array,
    Uint16Array,
    Int16Array,
    Uint32Array,
    Int32Array,
    Float32Array,
    Float64Array,
    Uint8ClampedArray,
    BigUint64Array,
    BigInt64Array,
    DataView,
    TextEncoder,
    AbortController,
    AbortSignal,
    EventTarget,
    Event,
    MessageChannel,
    MessagePort,
    MessageEvent,
    URLSearchParams,
    JSON,
    Math,
    Intl,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
    Atomics,
    WebAssembly,
    URL,
    CompressionStream,
    DecompressionStream,
    TextDecoder,
    globalThis,
    // The following globals are unknown for TypeScript
    // @ts-expect-error Unknown for TypeScript given our current compilation options
    AggregateError,
    // @ts-expect-error Unknown for TypeScript given our current compilation options
    FinalizationRegistry,
    // @ts-expect-error Unknown for TypeScript given our current compilation options
    WeakRef,
    // The following globals used to be unknown on MacOS,
    // as such we check they exist before referencing them
    typeof File !== 'undefined' ? File : undefined,
    typeof BroadcastChannel !== 'undefined' ? BroadcastChannel : undefined,
    typeof DOMException !== 'undefined' ? DOMException : undefined,
    typeof Blob !== 'undefined' ? Blob : undefined,
    typeof Performance !== 'undefined' ? Performance : undefined,
    typeof ReadableStream !== 'undefined' ? ReadableStream : undefined,
    typeof ReadableStreamDefaultReader !== 'undefined' ? ReadableStreamDefaultReader : undefined,
    typeof ReadableStreamBYOBReader !== 'undefined' ? ReadableStreamBYOBReader : undefined,
    typeof ReadableStreamBYOBRequest !== 'undefined' ? ReadableStreamBYOBRequest : undefined,
    typeof ReadableByteStreamController !== 'undefined' ? ReadableByteStreamController : undefined,
    typeof ReadableStreamDefaultController !== 'undefined' ? ReadableStreamDefaultController : undefined,
    typeof TransformStream !== 'undefined' ? TransformStream : undefined,
    typeof TransformStreamDefaultController !== 'undefined' ? TransformStreamDefaultController : undefined,
    typeof WritableStream !== 'undefined' ? WritableStream : undefined,
    typeof WritableStreamDefaultWriter !== 'undefined' ? WritableStreamDefaultWriter : undefined,
    typeof WritableStreamDefaultController !== 'undefined' ? WritableStreamDefaultController : undefined,
    typeof ByteLengthQueuingStrategy !== 'undefined' ? ByteLengthQueuingStrategy : undefined,
    typeof CountQueuingStrategy !== 'undefined' ? CountQueuingStrategy : undefined,
    typeof TextEncoderStream !== 'undefined' ? TextEncoderStream : undefined,
    typeof TextDecoderStream !== 'undefined' ? TextDecoderStream : undefined,
    typeof FormData !== 'undefined' ? FormData : undefined,
    typeof Headers !== 'undefined' ? Headers : undefined,
    typeof Request !== 'undefined' ? Request : undefined,
    typeof Response !== 'undefined' ? Response : undefined,
    typeof PerformanceEntry !== 'undefined' ? PerformanceEntry : undefined,
    typeof PerformanceMark !== 'undefined' ? PerformanceMark : undefined,
    typeof PerformanceMeasure !== 'undefined' ? PerformanceMeasure : undefined,
    typeof PerformanceObserver !== 'undefined' ? PerformanceObserver : undefined,
    typeof PerformanceObserverEntryList !== 'undefined' ? PerformanceObserverEntryList : undefined,
    typeof PerformanceResourceTiming !== 'undefined' ? PerformanceResourceTiming : undefined,
    typeof Crypto !== 'undefined' ? Crypto : undefined,
    typeof CryptoKey !== 'undefined' ? CryptoKey : undefined,
    typeof SubtleCrypto !== 'undefined' ? SubtleCrypto : undefined,
    typeof CustomEvent !== 'undefined' ? CustomEvent : undefined,
  ];
  const skippedGlobals = new Set(['Array']);
  const allAccessibleGlobals = Object.keys(Object.getOwnPropertyDescriptors(globalThis)).filter(
    (globalName) =>
      globalName[0] >= 'A' &&
      globalName[0] <= 'Z' &&
      (typeof (globalThis as any)[globalName] === 'function' || typeof (globalThis as any)[globalName] === 'object'),
  );
  const mainGlobalsSet = new Set<unknown>(mainGlobals);
  const missingGlobals: string[] = [];
  for (const globalName of allAccessibleGlobals) {
    if (skippedGlobals.has(globalName)) {
      continue;
    }
    if (!mainGlobalsSet.has((globalThis as any)[globalName])) {
      missingGlobals.push(globalName);
    }
  }
  expect(missingGlobals).toEqual([]);

  const restores: (() => void)[] = [];
  for (const mainGlobal of mainGlobals) {
    if (mainGlobals !== undefined) {
      if ('prototype' in mainGlobal) {
        restores.push(...dropAllFromObj(mainGlobal.prototype));
      }
      restores.push(...dropAllFromObj(mainGlobal));
    }
  }
  return () => restores.forEach((restore) => restore());
}

class NoopArbitrary extends fc.Arbitrary<number> {
  generate(_mrng: fc.Random, _biasFactor: number | undefined): fc.Value<number> {
    return new fc.Value<number>(0, undefined);
  }
  canShrinkWithoutContext(value: unknown): value is number {
    return false;
  }
  shrink(value: number, _context: unknown): fc.Stream<fc.Value<number>> {
    if (value > 5) {
      return fc.Stream.nil();
    }
    return fc.Stream.of(
      new fc.Value<number>(value + 1, undefined), // emulate a shrinker using bare minimal primitives
      new fc.Value<number>(value + 2, undefined),
      new fc.Value<number>(value + 3, undefined),
    );
  }
}
function noop() {
  // Always returns the same value and does not use random number instance.
  // The aim of this arbitrary is to control that we can execute the runner and property even in poisoned context.
  return new NoopArbitrary();
}
class BasicArbitrary extends fc.Arbitrary<number> {
  generate(mrng: fc.Random, _biasFactor: number | undefined): fc.Value<number> {
    return new fc.Value<number>(mrng.nextInt() % 1000, undefined);
  }
  canShrinkWithoutContext(value: unknown): value is number {
    return false;
  }
  shrink(value: number, _context: unknown): fc.Stream<fc.Value<number>> {
    if (value < 10) {
      return fc.Stream.nil();
    }
    return fc.Stream.of(
      new fc.Value<number>((3 * value) / 4, undefined), // emulate a shrinker using bare minimal primitives
      new fc.Value<number>(value / 2, undefined),
    );
  }
}
function basic() {
  // Directly extracting values out of mrng without too many treatments
  return new BasicArbitrary();
}
function mapToConstantEntry(offset: number) {
  return { num: 10, build: (v: number) => v + offset };
}
const CmpSameValueZero = { comparator: 'SameValueZero' as const };
const CmpIsStrictlyEqual = { comparator: 'IsStrictlyEqual' as const };
type Leaf = number;
type Node = { left: Tree; right: Tree };
type Tree = Leaf | Node;
function letrecTree() {
  return fc.letrec((tie) => ({
    tree: fc.oneof(tie('leaf'), tie('node')),
    node: fc.record({ left: tie('tree'), right: tie('tree') }),
    leaf: fc.nat(),
  })).tree;
}
function memoTree() {
  const tree = fc.memo<Tree>((n) => fc.oneof(leaf(), node(n)));
  const node = fc.memo<Node>((n): fc.Arbitrary<Node> => {
    if (n <= 1) return fc.record({ left: leaf(), right: leaf() });
    return fc.record({ left: tree(), right: tree() }); // tree() is equivalent to tree(n-1)
  });
  const leaf: () => fc.Arbitrary<Leaf> = fc.nat;
  return tree(2);
}
