import { assertNoPoisoning, restoreGlobals } from '../src/main.js';

describe('assertNoPoisoning', () => {
  it('should not throw any Error if no poisoning occurred', () => {
    // Arrange / Act / Assert
    expect(() => assertNoPoisoning()).not.toThrow();
    restoreGlobals();
    expect(() => assertNoPoisoning()).not.toThrow();
  });

  it('should throw an Error if new global appeared and be able to revert the change', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    globalThis.a = 'Hello';

    // Act / Assert
    try {
      expect(() => assertNoPoisoning()).toThrowError(/Poisoning detected/);
      restoreGlobals();
      expect(() => assertNoPoisoning()).not.toThrow();
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
      expect(() => assertNoPoisoning()).toThrowError(/Poisoning detected/);
      restoreGlobals();
      expect(() => assertNoPoisoning()).not.toThrow();
    } finally {
      globalThis.Function = F;
    }
  });

  it('should throw an Error if global altered via globalThis and be able to revert the change', () => {
    // Arrange
    const F = globalThis.Function;
    globalThis.Function = jest.fn();

    // Act / Assert
    try {
      expect(() => assertNoPoisoning()).toThrowError(/Poisoning detected/);
      restoreGlobals();
      expect(() => assertNoPoisoning()).not.toThrow();
    } finally {
      globalThis.Function = F;
    }
  });

  it('should throw an Error if global value altered and be able to revert the change', () => {
    // Arrange
    const F = Function;
    // eslint-disable-next-line no-global-assign
    Function = jest.fn();

    // Act / Assert
    try {
      expect(() => assertNoPoisoning()).toThrowError(/Poisoning detected/);
      restoreGlobals();
      expect(() => assertNoPoisoning()).not.toThrow();
    } finally {
      // eslint-disable-next-line no-global-assign
      Function = F;
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
        } catch (err) {
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
    // Manual expectation mimicing "expect(() => assertNoPoisoning()).toThrowError(/Poisoning detected/)"
    // as Jest makes use of Object.keys and probably others in its code
    let caughtError: unknown = undefined;
    try {
      assertNoPoisoning();
    } catch (err) {
      caughtError = err;
    }
    if (caughtError === undefined) {
      throw new Error('Expected an error be thrown during the test');
    }
    if (!(caughtError instanceof Error)) {
      throw new Error('Expected an error of type Error to be thrown during the test');
    }
    restoreGlobals();
    expect(() => assertNoPoisoning()).not.toThrow();
    // WARNING: If restoreGlobals failed, then this test may break others
  });
});
