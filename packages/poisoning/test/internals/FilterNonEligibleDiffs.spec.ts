import { filterNonEligibleDiffs, SubDiffOnGlobal } from '../../src/internals/FilterNonEligibleDiffs';
import { PoisoningFreeSet } from '../../src/internals/PoisoningFreeSet';

describe('filterNonEligibleDiffs', () => {
  it('should reject any direct property on globalThis matching the regex', () => {
    // Arrange
    const diff: SubDiffOnGlobal = {
      keyName: '_ignored', // Case: globalThis._ignored added, edited or dropped from globalThis
      globalDetails: { depth: 0, name: 'globalThis', rootAncestors: PoisoningFreeSet.from(['globalThis']) },
    };

    // Act
    const out = filterNonEligibleDiffs([diff], /^_/);

    // Assert
    expect(out).toHaveLength(0);
  });

  it('should keep any direct property on globalThis not matching the regex', () => {
    // Arrange
    const diff: SubDiffOnGlobal = {
      keyName: 'keepIt', // Case: globalThis.keepIt added, edited or dropped from globalThis
      globalDetails: { depth: 0, name: 'globalThis', rootAncestors: PoisoningFreeSet.from(['globalThis']) },
    };

    // Act
    const out = filterNonEligibleDiffs([diff], /^_/);

    // Assert
    expect(out).toEqual([diff]);
  });

  it('should reject any direct property of an ignored root', () => {
    // Arrange
    const diff: SubDiffOnGlobal = {
      keyName: 'child', // Case: globalThis._ignored.child added, edited or dropped from globalThis._ignored
      globalDetails: { depth: 1, name: '_ignored', rootAncestors: PoisoningFreeSet.from(['globalThis']) },
    };

    // Act
    const out = filterNonEligibleDiffs([diff], /^_/);

    // Assert
    expect(out).toHaveLength(0);
  });

  it('should keep any direct property of a non ignored root', () => {
    // Arrange
    const diff: SubDiffOnGlobal = {
      keyName: 'child', // Case: globalThis.keepIt.child added, edited or dropped from globalThis.keepIt
      globalDetails: { depth: 1, name: 'keepIt', rootAncestors: PoisoningFreeSet.from(['globalThis']) },
    };

    // Act
    const out = filterNonEligibleDiffs([diff], /^_/);

    // Assert
    expect(out).toEqual([diff]);
  });

  it('should reject any children having all roots ignored', () => {
    // Arrange
    const diff: SubDiffOnGlobal = {
      keyName: 'child', // Case: globalThis._ignored.[...].something.child added, edited or dropped from globalThis._ignored.[...].something
      globalDetails: { depth: 10, name: 'something', rootAncestors: PoisoningFreeSet.from(['_ignored']) },
    };

    // Act
    const out = filterNonEligibleDiffs([diff], /^_/);

    // Assert
    expect(out).toHaveLength(0);
  });

  it('should keep any children with all roots being non ignored', () => {
    // Arrange
    const diff: SubDiffOnGlobal = {
      keyName: 'child', // Case: globalThis.keepIt.[...].something.child added, edited or dropped from globalThis.keepIt.[...].something
      globalDetails: { depth: 10, name: 'something', rootAncestors: PoisoningFreeSet.from(['keepIt']) },
    };

    // Act
    const out = filterNonEligibleDiffs([diff], /^_/);

    // Assert
    expect(out).toEqual([diff]);
  });

  it('should keep any children as soon as one of the roots has not been ignored', () => {
    // Arrange
    const diff: SubDiffOnGlobal = {
      keyName: 'child', // Case: globalThis.keepIt.[...].something.child added, edited or dropped from globalThis.keepIt.[...].something
      globalDetails: { depth: 10, name: 'something', rootAncestors: PoisoningFreeSet.from(['_ignored', 'keepIt']) },
    };

    // Act
    const out = filterNonEligibleDiffs([diff], /^_/);

    // Assert
    expect(out).toEqual([diff]);
  });
});
