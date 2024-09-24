import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { indexToCharStringUnmapper } from '../../../../../src/arbitrary/_internals/mappers/IndexToCharString';

describe('indexToCharStringUnmapper', () => {
  it('should reject empty string', () => {
    // Arrange / Act / Assert
    expect(() => indexToCharStringUnmapper('')).toThrowError();
  });

  it('should reject invalid pairs', () => {
    // Arrange / Act / Assert
    expect(() => indexToCharStringUnmapper('\ud800\ud800')).toThrowError();
    expect(() => indexToCharStringUnmapper('a\ud800')).toThrowError();
    expect(() => indexToCharStringUnmapper('\udfff\ud800')).toThrowError();
  });

  it('should reject any longer than 1 code-point strings', () =>
    fc.assert(
      fc.property(fc.fullUnicodeString({ minLength: 2 }), (s) => {
        // Arrange / Act / Assert
        expect(() => indexToCharStringUnmapper(s)).toThrowError();
      }),
    ));

  it('should accept any 1 code-point string', () =>
    fc.assert(
      fc.property(fc.fullUnicode(), (c) => {
        // Arrange / Act / Assert
        expect(indexToCharStringUnmapper(c)).toBe(c.codePointAt(0));
      }),
    ));

  it('should accept any 1 char string (including half-surrogates)', () =>
    fc.assert(
      fc.property(
        fc.nat({ max: 0xffff }).map((n) => String.fromCharCode(n)),
        (c) => {
          // Arrange / Act / Assert
          expect(indexToCharStringUnmapper(c)).toBe(c.charCodeAt(0));
        },
      ),
    ));
});
