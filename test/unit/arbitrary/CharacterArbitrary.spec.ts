import { char, ascii, char16bits, unicode, hexa, base64, fullUnicode } from '../../../src/arbitrary/CharacterArbitrary';

import * as genericHelper from '../check/arbitrary/generic/GenericArbitraryHelper';

const remapCharToIndex = (c: string): number => {
  const cp = c.codePointAt(0)!;
  if (cp >= 0x20 && cp <= 0x7e) return cp - 0x20;
  if (cp < 0x20) return cp + 0x7e - 0x20;
  return cp;
};
const isStrictlySmallerCharacter = (c1: string, c2: string) => remapCharToIndex(c1) < remapCharToIndex(c2);

describe('CharacterArbitrary', () => {
  describe('char [single printable character]', () => {
    genericHelper.isValidArbitrary(() => char(), {
      isStrictlySmallerValue: isStrictlySmallerCharacter,
      isValidValue: (g: string) => g.length === 1 && 0x20 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0x7e,
    });
  });
  describe('ascii [single ascii character]', () => {
    genericHelper.isValidArbitrary(() => ascii(), {
      isStrictlySmallerValue: isStrictlySmallerCharacter,
      isValidValue: (g: string) => g.length === 1 && 0x00 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0x7f,
    });
  });
  describe('char16bits [single 16 bits character]', () => {
    genericHelper.isValidArbitrary(() => char16bits(), {
      isStrictlySmallerValue: isStrictlySmallerCharacter,
      isValidValue: (g: string) => g.length === 1 && 0x0000 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0xffff,
    });
  });
  describe('unicode [single unicode character of BMP plan]', () => {
    genericHelper.isValidArbitrary(() => unicode(), {
      isStrictlySmallerValue: isStrictlySmallerCharacter,
      isValidValue: (g: string) =>
        g.length === 1 &&
        0x0000 <= g.charCodeAt(0) &&
        g.charCodeAt(0) <= 0xffff &&
        !(0xd800 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0xdfff) /*surrogate pairs*/,
    });
  });
  describe('fullUnicode [single unicode character]', () => {
    genericHelper.isValidArbitrary(() => fullUnicode(), {
      isStrictlySmallerValue: isStrictlySmallerCharacter,
      isValidValue: (g: string) =>
        [...g].length === 1 &&
        0x0000 <= g.codePointAt(0)! &&
        g.codePointAt(0)! <= 0x10ffff &&
        !(0xd800 <= g.codePointAt(0)! && g.codePointAt(0)! <= 0xdfff) /*surrogate pairs*/,
    });
  });
  describe('hexa [single hexa character]', () => {
    genericHelper.isValidArbitrary(() => hexa(), {
      isStrictlySmallerValue: (c1: string, c2: string) => {
        const evaluate = (c: string) => ('0' <= c && c <= '9' ? c.charCodeAt(0) - 48 : c.charCodeAt(0) - 87);
        return evaluate(c1) < evaluate(c2);
      },
      isValidValue: (g: string) => g.length === 1 && (('0' <= g && g <= '9') || ('a' <= g && g <= 'f')),
    });
  });
  describe('base64 [single base64 character]', () => {
    genericHelper.isValidArbitrary(() => base64(), {
      isStrictlySmallerValue: (c1: string, c2: string) => {
        const evaluate = (c: string) => {
          if ('A' <= c && c <= 'Z') return c.charCodeAt(0) - 'A'.charCodeAt(0);
          if ('a' <= c && c <= 'z') return c.charCodeAt(0) - 'a'.charCodeAt(0) + 26;
          if ('0' <= c && c <= '9') return c.charCodeAt(0) - '0'.charCodeAt(0) + 52;
          return c === '+' ? 62 : 63;
        };
        return evaluate(c1) < evaluate(c2);
      },
      isValidValue: (g: string) =>
        g.length === 1 &&
        (('a' <= g && g <= 'z') || ('A' <= g && g <= 'Z') || ('0' <= g && g <= '9') || g === '+' || g === '/'),
    });
  });
});
