import { restoreGlobals } from '@fast-check/poisoning';
import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`Poisoning (seed: ${seed})`, () => {
  it.each`
    name         | arbitraryBuilder
    ${'integer'} | ${() => fc.integer()}
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
    expect(interceptedException).toMatch(/Property failed after/);
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
    //Number,
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
