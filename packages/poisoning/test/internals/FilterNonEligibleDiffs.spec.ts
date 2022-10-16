import { GlobalDetails } from '../../src/internals/types/AllGlobals';
import { shouldIgnoreGlobal, shouldIgnoreProperty } from '../../src/internals/FilterNonEligibleDiffs';
import { PoisoningFreeSet } from '../../src/internals/PoisoningFreeSet';

describe('shouldIgnore{Global,Property}', () => {
  it('should reject any direct property on globalThis matching the regex', () => {
    // Arrange
    const entry: Entry = {
      keyName: '_ignored', // Case: globalThis._ignored added, edited or dropped from globalThis
      globalDetails: { depth: 0, name: 'globalThis', rootAncestors: PoisoningFreeSet.from(['globalThis']) },
    };

    // Act
    const out = shouldIgnore(entry, /^_/);

    // Assert
    expect(out).toEqual({ global: false, property: true });
  });

  it('should keep any direct property on globalThis not matching the regex', () => {
    // Arrange
    const entry: Entry = {
      keyName: 'keepIt', // Case: globalThis.keepIt added, edited or dropped from globalThis
      globalDetails: { depth: 0, name: 'globalThis', rootAncestors: PoisoningFreeSet.from(['globalThis']) },
    };

    // Act
    const out = shouldIgnore(entry, /^_/);

    // Assert
    expect(out).toEqual({ global: false, property: false });
  });

  it('should reject any direct property of an ignored root', () => {
    // Arrange
    const entry: Entry = {
      keyName: 'child', // Case: globalThis._ignored.child added, edited or dropped from globalThis._ignored
      globalDetails: { depth: 1, name: '_ignored', rootAncestors: PoisoningFreeSet.from(['globalThis']) },
    };

    // Act
    const out = shouldIgnore(entry, /^_/);

    // Assert
    expect(out).toEqual({ global: true, property: true });
  });

  it('should keep any direct property of a non ignored root', () => {
    // Arrange
    const entry: Entry = {
      keyName: 'child', // Case: globalThis.keepIt.child added, edited or dropped from globalThis.keepIt
      globalDetails: { depth: 1, name: 'keepIt', rootAncestors: PoisoningFreeSet.from(['globalThis']) },
    };

    // Act
    const out = shouldIgnore(entry, /^_/);

    // Assert
    expect(out).toEqual({ global: false, property: false });
  });

  it('should reject any children having all roots ignored', () => {
    // Arrange
    const entry: Entry = {
      keyName: 'child', // Case: globalThis._ignored.[...].something.child added, edited or dropped from globalThis._ignored.[...].something
      globalDetails: { depth: 10, name: 'something', rootAncestors: PoisoningFreeSet.from(['_ignored']) },
    };

    // Act
    const out = shouldIgnore(entry, /^_/);

    // Assert
    expect(out).toEqual({ global: true, property: true });
  });

  it('should keep any children with all roots being non ignored', () => {
    // Arrange
    const entry: Entry = {
      keyName: 'child', // Case: globalThis.keepIt.[...].something.child added, edited or dropped from globalThis.keepIt.[...].something
      globalDetails: { depth: 10, name: 'something', rootAncestors: PoisoningFreeSet.from(['keepIt']) },
    };

    // Act
    const out = shouldIgnore(entry, /^_/);

    // Assert
    expect(out).toEqual({ global: false, property: false });
  });

  it('should keep any children as soon as one of the roots has not been ignored', () => {
    // Arrange
    const entry: Entry = {
      keyName: 'child', // Case: globalThis.keepIt.[...].something.child added, edited or dropped from globalThis.keepIt.[...].something
      globalDetails: { depth: 10, name: 'something', rootAncestors: PoisoningFreeSet.from(['_ignored', 'keepIt']) },
    };

    // Act
    const out = shouldIgnore(entry, /^_/);

    // Assert
    expect(out).toEqual({ global: false, property: false });
  });
});

// Helper

type Entry = {
  keyName: string;
  globalDetails: Pick<GlobalDetails, 'depth' | 'name' | 'rootAncestors'>;
};

function shouldIgnore(entry: Entry, ignoredRootRegex: RegExp): { global: boolean; property: boolean } {
  return {
    global: shouldIgnoreGlobal(entry.globalDetails, ignoredRootRegex),
    property: shouldIgnoreProperty(entry.globalDetails, entry.keyName, ignoredRootRegex),
  };
}
