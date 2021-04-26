import * as fc from '../../../../../lib/fast-check';
import { charToCode } from '../../../../../src/arbitrary/_internals/builders/CharacterArbitraryBuilder';

describe('charToCode', () => {
  it('should reject empty string', () => {
    // Arrange / Act / Assert
    expect(() => charToCode('')).toThrowError();
  });

  it('should reject invalid pairs', () => {
    // Arrange / Act / Assert
    expect(() => charToCode('\ud800\ud800')).toThrowError();
    expect(() => charToCode('a\ud800')).toThrowError();
    expect(() => charToCode('\udfff\ud800')).toThrowError();
  });

  it('should reject any longer than 1 code-point strings', () =>
    fc.assert(
      fc.property(fc.fullUnicodeString({ minLength: 2 }), (s) => {
        // Arrange / Act / Assert
        expect(() => charToCode(s)).toThrowError();
      })
    ));

  it('should accept any 1 code-point string', () =>
    fc.assert(
      fc.property(fc.fullUnicode(), (c) => {
        // Arrange / Act / Assert
        expect(charToCode(c)).toBe(c.codePointAt(0));
      })
    ));

  it('should accept any 1 char string (including half-surrogates)', () =>
    fc.assert(
      fc.property(fc.char16bits(), (c) => {
        // Arrange / Act / Assert
        expect(charToCode(c)).toBe(c.charCodeAt(0));
      })
    ));
});
