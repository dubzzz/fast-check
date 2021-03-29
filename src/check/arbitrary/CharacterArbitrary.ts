import { Arbitrary } from './definition/Arbitrary';
import { convertFromNext, convertToNext } from './definition/Converters';
import { integer } from './IntegerArbitrary';

/** @internal */
function CharacterArbitrary(
  min: number,
  max: number,
  mapToCode: (v: number) => number,
  unmapFromCode: (v: number) => number
) {
  return convertFromNext(
    convertToNext(integer(min, max)).map(
      (n) => String.fromCodePoint(mapToCode(n)),
      (value: unknown): number => {
        if (typeof value !== 'string') {
          throw new Error('Cannot unmap received value');
        }
        const n = value.codePointAt(0);
        if (n === undefined) {
          throw new Error('Cannot unmap received value');
        }
        return unmapFromCode(n);
      }
    )
  );
}

/** @internal */
const preferPrintableMapper = (v: number): number => {
  if (v < 95) return v + 0x20; // 0x20-0x7e
  if (v <= 0x7e) return v - 95;
  return v;
};

/** @internal */
const preferPrintableUnmapper = (v: number): number => {
  if (v >= 0x20 && v <= 0x7e) return v - 0x20; // v + 0x20
  if (v >= 0 && v <= 0x1f) return v + 95; // v - 95
  return v;
};

/**
 * For single printable ascii characters - char code between 0x20 (included) and 0x7e (included)
 *
 * {@link https://www.ascii-code.com/}
 *
 * @remarks Since 0.0.1
 * @public
 */
function char(): Arbitrary<string> {
  // Only printable characters: https://www.ascii-code.com/
  return CharacterArbitrary(
    0x20,
    0x7e,
    (v) => v,
    (v) => v
  );
}

/**
 * For single hexadecimal characters - 0-9 or a-f
 * @remarks Since 0.0.1
 * @public
 */
function hexa(): Arbitrary<string> {
  function mapper(v: number) {
    return v < 10
      ? v + 48 // 0-9
      : v + 97 - 10; // a-f
  }
  function unmapper(v: number) {
    return v < 58
      ? v - 48 // 0-9
      : v < 103
      ? v - 97 + 10 // a-f
      : -1; // invalid: out of scope
  }
  return CharacterArbitrary(0, 15, mapper, unmapper);
}

/**
 * For single base64 characters - A-Z, a-z, 0-9, + or /
 * @remarks Since 0.0.1
 * @public
 */
function base64(): Arbitrary<string> {
  function mapper(v: number) {
    if (v < 26) return v + 65; // A-Z
    if (v < 52) return v + 97 - 26; // a-z
    if (v < 62) return v + 48 - 52; // 0-9
    return v === 62 ? 43 : 47; // +/
  }
  function unmapper(v: number) {
    if (v >= 65 && v <= 90) return v - 65; // A-Z
    if (v >= 97 && v <= 122) return v - 97 + 26; // a-z
    if (v >= 48 && v <= 57) return v - 48 + 52; // 0-9
    return v === 43 ? 62 : v === 47 ? 63 : -1; // +/
  }
  return CharacterArbitrary(0, 63, mapper, unmapper);
}

/**
 * For single ascii characters - char code between 0x00 (included) and 0x7f (included)
 * @remarks Since 0.0.1
 * @public
 */
function ascii(): Arbitrary<string> {
  return CharacterArbitrary(0x00, 0x7f, preferPrintableMapper, preferPrintableUnmapper);
}

/**
 * For single characters - all values in 0x0000-0xffff can be generated
 *
 * WARNING:
 *
 * Some generated characters might appear invalid regarding UCS-2 and UTF-16 encoding.
 * Indeed values within 0xd800 and 0xdfff constitute surrogate pair characters and are illegal without their paired character.
 *
 * @remarks Since 0.0.11
 * @public
 */
function char16bits(): Arbitrary<string> {
  return CharacterArbitrary(0x0000, 0xffff, preferPrintableMapper, preferPrintableUnmapper);
}

/**
 * For single unicode characters defined in the BMP plan - char code between 0x0000 (included) and 0xffff (included) and without the range 0xd800 to 0xdfff (surrogate pair characters)
 * @remarks Since 0.0.11
 * @public
 */
function unicode(): Arbitrary<string> {
  // Characters in the range: U+D800 to U+DFFF
  // are called 'surrogate pairs', they cannot be defined alone and come by pairs
  // JavaScript function 'fromCodePoint' can handle those
  // This unicode builder is able to produce a subset of UTF-16 characters called UCS-2
  // You can refer to 'fromCharCode' documentation for more details
  const gapSize = 0xdfff + 1 - 0xd800;
  function mapper(v: number) {
    if (v < 0xd800) return preferPrintableMapper(v);
    return v + gapSize;
  }
  function unmapper(v: number) {
    if (v < 0xd800) return preferPrintableUnmapper(v);
    return v - gapSize;
  }
  return CharacterArbitrary(0x0000, 0xffff - gapSize, mapper, unmapper);
}

/**
 * For single unicode characters - any of the code points defined in the unicode standard
 *
 * WARNING: Generated values can have a length greater than 1.
 *
 * {@link https://tc39.github.io/ecma262/#sec-utf16encoding}
 *
 * @remarks Since 0.0.11
 * @public
 */
function fullUnicode(): Arbitrary<string> {
  // Be aware that 'characters' can have a length greater than 1
  // More details on: https://tc39.github.io/ecma262/#sec-utf16encoding
  // This unicode builder is able to produce all the UTF-16 characters
  // It only produces valid UTF-16 code points
  const gapSize = 0xdfff + 1 - 0xd800;
  function mapper(v: number) {
    if (v < 0xd800) return preferPrintableMapper(v);
    return v + gapSize;
  }
  function unmapper(v: number) {
    if (v < 0xd800) return preferPrintableUnmapper(v);
    return v - gapSize;
  }
  return CharacterArbitrary(0x0000, 0x10ffff - gapSize, mapper, unmapper);
}

export { char, ascii, char16bits, unicode, fullUnicode, hexa, base64 };
