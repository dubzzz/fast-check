import Random from '../../random/generator/Random';
import { Stream, stream } from '../../stream/Stream';
import Arbitrary from './definition/Arbitrary';
import Shrinkable from './definition/Shrinkable';
import { integer } from './IntegerArbitrary';

/** @internalapi */
function CharacterArbitrary(min: number, max: number, mapToCode: (v: number) => number = v => v) {
  return integer(min, max).map(n => String.fromCharCode(mapToCode(n)));
}

/**
 * Arbitrary producing a single printable ascii character.
 * Character with char code between 0x20 (included) and 0x7e (included)
 *
 * @see https://www.ascii-code.com/
 */
function char(): Arbitrary<string> {
  // Only printable characters: https://www.ascii-code.com/
  return CharacterArbitrary(0x20, 0x7e);
}

/**
 * Arbitrary producing a single hexadecimal character.
 * Character in 0-9, a-f
 */
function hexa(): Arbitrary<string> {
  function mapper(v: number) {
    return v < 10
      ? v + 48 // 0-9
      : v + 97 - 10; // a-f
  }
  return CharacterArbitrary(0, 15, mapper);
}

/**
 * Arbitrary producing a single base 64 character.
 * Character in A-Z, a-z, 0-9, + or /
 */
function base64(): Arbitrary<string> {
  function mapper(v: number) {
    if (v < 26) return v + 65; // A-Z
    if (v < 52) return v + 97 - 26; // a-z
    if (v < 62) return v + 48 - 52; // 0-9
    return v === 62 ? 43 : 47; // +/
  }
  return CharacterArbitrary(0, 63, mapper);
}

/**
 * Arbitrary producing a single ascii character.
 * Character with char code between 0x00 (included) and 0x7f (included)
 */
function ascii(): Arbitrary<string> {
  return CharacterArbitrary(0x00, 0x7f);
}

/**
 * Arbitrary producing a single character.
 * Character can be any of the values between 0x0000 and 0xffff
 *
 * WARNING:
 * Some generated characters might appear invalid regarding UCS-2 and UTF-16 encoding.
 * Indeed values within 0xd800 and 0xdfff constitute surrogate pair characters and are illegal without their paired character.
 */
function char16bits(): Arbitrary<string> {
  return CharacterArbitrary(0x0000, 0xffff);
}

/**
 * Arbitrary producing a single unicode code point inside the BMP plan
 *
 * Character with char code between 0x0000 (included) and 0xffff (included)
 * but without the range 0xd800 to 0xdfff (surrogate pair characters)
 */
function unicode(): Arbitrary<string> {
  // Characters in the range: U+D800 to U+DFFF
  // are called 'surrogate pairs', they cannot be defined alone and come by pairs
  // JavaScript function 'fromCodePoint' can handle those
  // This unicode builder is able to produce a subset of UTF-16 characters called UCS-2
  // You can refer to 'fromCharCode' documentation for more details
  const gapSize = 0xdfff + 1 - 0xd800;
  function mapping(v: number) {
    if (v < 0xd800) return v;
    return v + gapSize;
  }
  return CharacterArbitrary(0x0000, 0xffff - gapSize, mapping);
}

/**
 * Arbitrary producing a single code point.
 * It can generate any of the code points defined in the unicode standard
 *
 * WARNING:
 * Generated values can have a length greater than 1.
 * More details on: https://tc39.github.io/ecma262/#sec-utf16encoding
 */
function fullUnicode(): Arbitrary<string> {
  // Might require a polyfill if String.fromCodePoint is missing
  // from the node version or web-browser
  // Be aware that 'characters' can have a length greater than 1
  // More details on: https://tc39.github.io/ecma262/#sec-utf16encoding
  // This unicode builder is able to produce all the UTF-16 characters
  // It only produces valid UTF-16 code points
  const gapSize = 0xdfff + 1 - 0xd800;
  function mapping(v: number) {
    if (v < 0xd800) return v;
    return v + gapSize;
  }
  // Do not call CharacterArbitrary or use fromCodePoint in it
  // String.fromCodePoint is unknown for older versions of node
  return integer(0x0000, 0x10ffff - gapSize).map(n => String.fromCodePoint(mapping(n)));
}

export { char, ascii, char16bits, unicode, fullUnicode, hexa, base64 };
