import { describe, it, expect } from 'vitest';
import { buildVersionsAppliersForUuid } from '../../../../../src/arbitrary/_internals/mappers/VersionsApplierForUuid';
import fc from 'fast-check';

describe('versionsApplierMapper', () => {
  it('should transform the first hexa element to its proper version', () => {
    // Arrange
    const source = '301'; // 3 means 4th entry
    const versions = [10, 3, 7, 9, 15];

    // Act
    const { versionsApplierMapper } = buildVersionsAppliersForUuid(versions);
    const out = versionsApplierMapper(source);

    // Assert
    expect(out).toBe('901');
  });

  it('should correctly transform to versions strictly above 9', () => {
    // Arrange
    const source = '481'; // 4 means 5th entry
    const versions = [10, 3, 7, 9, 15];

    // Act
    const { versionsApplierMapper } = buildVersionsAppliersForUuid(versions);
    const out = versionsApplierMapper(source);

    // Assert
    expect(out).toBe('f81');
  });
});

describe('versionsApplierUnmapper', () => {
  const items = '0123456789abcdef';
  function hexa(): fc.Arbitrary<string> {
    return fc.integer({ min: 0, max: 15 }).map((n) => items[n]);
  }

  it('should correctly unmap from a known version', () => {
    // Arrange
    const source = '901'; // 9 is at index 3, so it should unmap to 3
    const versions = [10, 3, 7, 9, 15];

    // Act
    const { versionsApplierUnmapper } = buildVersionsAppliersForUuid(versions);
    const out = versionsApplierUnmapper(source);

    // Assert
    expect(out).toBe('301');
  });

  it('should reject unknown versions', () => {
    // Arrange
    const source = '801'; // 8 is unknown
    const versions = [10, 3, 7, 9, 15];

    // Act
    const { versionsApplierUnmapper } = buildVersionsAppliersForUuid(versions);

    // Assert
    expect(() => versionsApplierUnmapper(source)).toThrowError();
  });

  it('should reject versions with invalid case', () => {
    // Arrange
    const source = 'F01'; // F is unknown, but f would have be known
    const versions = [10, 3, 7, 9, 15];

    // Act
    const { versionsApplierUnmapper } = buildVersionsAppliersForUuid(versions);

    // Assert
    expect(() => versionsApplierUnmapper(source)).toThrowError();
  });

  it('should be able to unmap any mapped value', () =>
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.nat({ max: 15 }), { minLength: 1 }),
        fc.nat(),
        fc.string({ unit: hexa() }),
        (versions, diceIndex, tail) => {
          // Arrange
          const index = diceIndex % versions.length;
          const source = index.toString(16) + tail;
          const { versionsApplierMapper, versionsApplierUnmapper } = buildVersionsAppliersForUuid(versions);
          const mapped = versionsApplierMapper(source);

          // Act
          const out = versionsApplierUnmapper(mapped);

          // Assert
          expect(out).toEqual(source);
        },
      ),
    ));
});
