import { restoreGlobals } from '@fast-check/poisoning';
import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`Poisoning (seed: ${seed})`, () => {
  it.each`
    name      | arbitraryBuilder
    ${'noop'} | ${() => noop()}
  `('should not be impacted by altered globals when using $name', ({ arbitraryBuilder }) => {
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
    dropMainGlobals();

    // Act
    let interceptedException: unknown = undefined;
    try {
      fc.assert(
        fc.property(arbitraryBuilder(), (_v) => testResult()),
        { seed }
      );
    } catch (err) {
      interceptedException = err;
    }

    // Assert
    restoreGlobals(); // Restore globals before running real checks
    expect(interceptedException).toBeDefined();
    expect(interceptedException).toBeInstanceOf(Error);
    expect((interceptedException as Error).message).toMatch(/Property failed after/);
  });
});

// Helpers

const own = Object.getOwnPropertyNames;
function dropAllFromObj(obj: unknown): void {
  for (const k of own(obj)) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete obj[k];
    } catch (err) {
      // Object.prototype cannot be deleted, and others might too
    }
  }
}
function dropMainGlobals(): void {
  const mainGlobals = [
    //Object,
    //Function,
    //Array,
    Number,
    Boolean,
    //String,
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
    WeakRef,
    FinalizationRegistry,
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
    TextDecoder,
    AbortController,
    AbortSignal,
    EventTarget,
    Event,
    MessageChannel,
    MessagePort,
    MessageEvent,
    //URL,
    URLSearchParams,
    JSON,
    Math,
    Intl,
  ];
  for (const mainGlobal of mainGlobals) {
    if ('prototype' in mainGlobal) {
      dropAllFromObj(mainGlobal.prototype);
    }
    dropAllFromObj(mainGlobal);
  }
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
      new fc.Value<number>(value + 3, undefined)
    );
  }
}
function noop() {
  // Always returns the same value and does not use random number instance.
  // The aim of this arbitrary is to control that we can execute the runner and property even in poisoned context.
  return new NoopArbitrary();
}
