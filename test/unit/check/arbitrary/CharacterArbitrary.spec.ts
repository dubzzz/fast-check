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
  describe('char', () => {
    genericHelper.testAlwaysCorrectValues(
      fc.constant(null),
      () => char(),
      (empty: null, g: string) => g.length === 1 && 0x20 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0x7e,
      'single printable character'
    );
  });
  describe('ascii', () => {
    genericHelper.testAlwaysCorrectValues(
      fc.constant(null),
      () => ascii(),
      (empty: null, g: string) => g.length === 1 && 0x00 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0x7f,
      'single ascii character'
    );
  });
  describe('char16bits', () => {
    genericHelper.testAlwaysCorrectValues(
      fc.constant(null),
      () => char16bits(),
      (empty: null, g: string) => g.length === 1 && 0x0000 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0xffff,
      'single 16 bits character'
    );
  });
  describe('unicode', () => {
    genericHelper.testAlwaysCorrectValues(
      fc.constant(null),
      () => unicode(),
      (empty: null, g: string) =>
        g.length === 1 &&
        0x0000 <= g.charCodeAt(0) &&
        g.charCodeAt(0) <= 0xffff &&
        !(0xd800 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0xdfff) /*surrogate pairs*/,
      'single unicode character of BMP plan'
    );
  });
  describe('fullUnicode', () => {
    genericHelper.testAlwaysCorrectValues(
      fc.constant(null),
      () => fullUnicode(),
      (empty: null, g: string) =>
        [...g].length === 1 &&
        0x0000 <= g.codePointAt(0)! &&
        g.codePointAt(0)! <= 0x10ffff &&
        !(0xd800 <= g.codePointAt(0)! && g.codePointAt(0)! <= 0xdfff) /*surrogate pairs*/,
      'single unicode character'
    );
  });
  describe('hexa', () => {
    genericHelper.testAlwaysCorrectValues(
      fc.constant(null),
      () => hexa(),
      (empty: null, g: string) => g.length === 1 && (('0' <= g && g <= '9') || ('a' <= g && g <= 'f')),
      'single hexa character'
    );
  });
  describe('base64', () => {
    genericHelper.testAlwaysCorrectValues(
      fc.constant(null),
      () => base64(),
      (empty: null, g: string) =>
        g.length === 1 &&
        (('a' <= g && g <= 'z') || ('A' <= g && g <= 'Z') || ('0' <= g && g <= '9') || g === '+' || g === '/'),
      'single base64 character'
    );
  });
});
