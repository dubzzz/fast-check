import { describe, it, expect, vi } from 'vitest';
import { assertNoPoisoning, restoreGlobals } from '../src/main.js';

const options = { ignoredRootRegex: /__vitest_worker__/ };

describe('assertNoPoisoning', () => {
  it('should not throw any Error if no poisoning occurred', () => {
    // Arrange / Act / Assert
    expect(() => assertNoPoisoning(options)).not.toThrow();
    restoreGlobals(options);
    expect(() => assertNoPoisoning(options)).not.toThrow();
  });

  it('should throw an Error if new global appeared and be able to revert the change', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    globalThis.a = 'Hello';

    // Act / Assert
    try {
      expect(() => assertNoPoisoning(options)).toThrowError(/Poisoning detected/);
      restoreGlobals(options);
      expect(() => assertNoPoisoning(options)).not.toThrow();
    } finally {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete globalThis.a;
    }
  });

  it('should throw an Error if global removed and be able to revert the change', () => {
    // Arrange
    const F = globalThis.Function;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete globalThis.Function;

    // Act / Assert
    try {
      expect(() => assertNoPoisoning(options)).toThrowError(/Poisoning detected/);
      restoreGlobals(options);
      expect(() => assertNoPoisoning(options)).not.toThrow();
    } finally {
      globalThis.Function = F;
    }
  });

  it('should throw an Error if global altered via globalThis and be able to revert the change', () => {
    // Arrange
    const F = globalThis.Function;
    globalThis.Function = vi.fn() as any;

    // Act / Assert
    try {
      expect(() => assertNoPoisoning(options)).toThrowError(/Poisoning detected/);
      restoreGlobals(options);
      expect(() => assertNoPoisoning(options)).not.toThrow();
    } finally {
      globalThis.Function = F;
    }
  });

  it('should throw an Error if global value altered and be able to revert the change', () => {
    // Arrange
    const F = Function;
    // eslint-disable-next-line no-global-assign
    Function = vi.fn() as any;

    // Act / Assert
    try {
      expect(() => assertNoPoisoning(options)).toThrowError(/Poisoning detected/);
      restoreGlobals(options);
      expect(() => assertNoPoisoning(options)).not.toThrow();
    } finally {
      // eslint-disable-next-line no-global-assign
      Function = F;
    }
  });

  it('should throw an Error if globalThis gets changed into another type and be able to revert the change', () => {
    // Arrange
    const G = globalThis;
    // eslint-disable-next-line no-global-assign
    (globalThis as any) = 1;

    // Act / Assert
    let error: unknown = undefined;
    try {
      assertNoPoisoning(options);
    } catch (err) {
      error = err;
    }
    if (error === undefined) {
      // eslint-disable-next-line no-global-assign
      (globalThis as any) = G;
      throw new Error('No error has been thrown');
    }
    if (!/Poisoning detected/.test((error as Error).message)) {
      // eslint-disable-next-line no-global-assign
      (globalThis as any) = G;
      throw new Error(`Received error does not fulfill expectations, got: ${error}`);
    }
    try {
      restoreGlobals(options);
      expect(() => assertNoPoisoning(options)).not.toThrow();
    } finally {
      // eslint-disable-next-line no-global-assign
      (globalThis as any) = G;
    }
  });

  it('should be able to handle highly destructive changes removing important primitives', () => {
    // Arrange
    const own = Object.getOwnPropertyNames;
    function dropAll<T>(name: string, obj: T): void {
      let numDeleted = 0;
      for (const k of own(obj)) {
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          delete obj[k];
          ++numDeleted;
        } catch {
          // Object.prototype cannot be deleted, and others might too
        }
      }
      if (numDeleted === 0) {
        throw new Error(`No property has been deleted from ${name}`);
      }
    }
    dropAll('Object.prototype', Object.prototype);
    dropAll('Object', Object);
    dropAll('Array.prototype', Array.prototype);
    dropAll('Array', Array);
    dropAll('Set.prototype', Set.prototype);
    dropAll('Set', Set);
    dropAll('Map.prototype', Map.prototype);
    dropAll('Map', Map);
    dropAll('Function.prototype', Function.prototype);
    dropAll('Function', Function);
    dropAll('Error.prototype', Error.prototype);
    dropAll('Error', Error);

    // Act / Assert
    // Manual expectation mimicing "expect(() => assertNoPoisoning(options)).toThrowError(/Poisoning detected/)"
    // as Jest makes use of Object.keys and probably others in its code
    let caughtError: unknown = undefined;
    try {
      assertNoPoisoning(options);
    } catch (err) {
      caughtError = err;
    }
    if (caughtError === undefined) {
      throw new Error('Expected an error be thrown during the test');
    }
    if (!(caughtError instanceof Error)) {
      throw new Error('Expected an error of type Error to be thrown during the test');
    }
    restoreGlobals(options);
    expect(() => assertNoPoisoning(options)).not.toThrow();
    // WARNING: If restoreGlobals failed, then this test may break others
  });
});
