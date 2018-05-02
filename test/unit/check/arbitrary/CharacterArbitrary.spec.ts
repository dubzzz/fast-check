import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';

import {
  char,
  ascii,
  char16bits,
  unicode,
  hexa,
  base64,
  fullUnicode
} from '../../../../src/check/arbitrary/CharacterArbitrary';

import * as genericHelper from './generic/GenericArbitraryHelper';

import * as stubRng from '../../stubs/generators';

describe('CharacterArbitrary', () => {
  describe('char [single printable character]', () => {
    genericHelper.isValidArbitrary(() => char(), {
      isValidValue: (g: string) => g.length === 1 && 0x20 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0x7e
    });
  });
  describe('ascii [single ascii character]', () => {
    genericHelper.isValidArbitrary(() => ascii(), {
      isValidValue: (g: string) => g.length === 1 && 0x00 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0x7f
    });
  });
  describe('char16bits [single 16 bits character]', () => {
    genericHelper.isValidArbitrary(() => char16bits(), {
      isValidValue: (g: string) => g.length === 1 && 0x0000 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0xffff
    });
  });
  describe('unicode [single unicode character of BMP plan]', () => {
    genericHelper.isValidArbitrary(() => unicode(), {
      isValidValue: (g: string) =>
        g.length === 1 &&
        0x0000 <= g.charCodeAt(0) &&
        g.charCodeAt(0) <= 0xffff &&
        !(0xd800 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0xdfff) /*surrogate pairs*/
    });
  });
  describe('fullUnicode [single unicode character]', () => {
    genericHelper.isValidArbitrary(() => fullUnicode(), {
      isValidValue: (g: string) =>
        [...g].length === 1 &&
        0x0000 <= g.codePointAt(0)! &&
        g.codePointAt(0)! <= 0x10ffff &&
        !(0xd800 <= g.codePointAt(0)! && g.codePointAt(0)! <= 0xdfff) /*surrogate pairs*/
    });
  });
  describe('hexa [single hexa character]', () => {
    genericHelper.isValidArbitrary(() => hexa(), {
      isValidValue: (g: string) => g.length === 1 && (('0' <= g && g <= '9') || ('a' <= g && g <= 'f'))
    });
  });
  describe('base64 [single base64 character]', () => {
    genericHelper.isValidArbitrary(() => base64(), {
      isValidValue: (g: string) =>
        g.length === 1 &&
        (('a' <= g && g <= 'z') || ('A' <= g && g <= 'Z') || ('0' <= g && g <= '9') || g === '+' || g === '/')
    });
  });
});
