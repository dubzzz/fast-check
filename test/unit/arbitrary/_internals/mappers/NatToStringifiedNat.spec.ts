import fc from '../../../../../lib/fast-check';
import {
  natToStringifiedNatUnmapper,
  natToStringifiedNatMapper,
  tryParseStringifiedNat,
} from '../../../../../src/arbitrary/_internals/mappers/NatToStringifiedNat';

describe('tryParseStringifiedNat', () => {
  it('should be able to parse any nat serialized with toString(radix)', () =>
    fc.assert(
      fc.property(fc.maxSafeNat(), fc.integer({ min: 2, max: 36 }), (n, radix) => {
        // Arrange
        const stringifiedNat = n.toString(radix);

        // Act
        const out = tryParseStringifiedNat(stringifiedNat, radix);

        // Assert
        expect(out).toBe(n);
      })
    ));
});

describe('natToStringifiedNatUnmapper', () => {
  it.each`
    value     | reason
    ${''}     | ${'empty string'}
    ${'1e0'}  | ${'no scientific notation'}
    ${'x00'}  | ${'incomplete hex with missing start'}
    ${'0x'}   | ${'incomplete hex with missing end'}
    ${'0x00'} | ${'too many figures hex'}
    ${'0xF'}  | ${'wrong case for hex'}
    ${'000'}  | ${'too many figures oct'}
  `('should reject "$value" ($reason)', ({ value }) => {
    // Arrange / Act / Assert
    expect(() => natToStringifiedNatUnmapper(value)).toThrowError();
  });

  it('should be able to unmap any mapped value', () =>
    fc.assert(
      fc.property(fc.maxSafeNat(), fc.constantFrom(...(['dec', 'oct', 'hex'] as const)), (n, base) => {
        // Arrange
        const stringifiedNat = natToStringifiedNatMapper([base, n]);

        // Act
        const out = natToStringifiedNatUnmapper(stringifiedNat);

        // Assert
        expect(out[0]).toBe(base);
        expect(out[1]).toBe(n);
      })
    ));
});
