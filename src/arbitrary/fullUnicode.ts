import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { buildCharacterArbitrary } from './_internals/builders/CharacterArbitraryBuilder';
import { preferPrintableMapper, preferPrintableUnmapper } from './_internals/mappers/PreferPrintable';

// Characters in the range: U+D800 to U+DFFF
// are called 'surrogate pairs', they cannot be defined alone and come by pairs
// JavaScript function 'fromCodePoint' can handle those
// This unicode builder is able to produce a subset of UTF-16 characters called UCS-2
// You can refer to 'fromCharCode' documentation for more details
/** @internal */
const gapSize = 0xdfff + 1 - 0xd800;

/** @internal */
function unicodeMapper(v: number) {
  if (v < 0xd800) return preferPrintableMapper(v);
  return v + gapSize;
}

/** @internal */
function unicodeUnmapper(v: number) {
  if (v < 0xd800) return preferPrintableUnmapper(v);
  if (v <= 0xdfff) return -1;
  return v - gapSize;
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
export function fullUnicode(): Arbitrary<string> {
  return buildCharacterArbitrary(0x0000, 0x10ffff - gapSize, unicodeMapper, unicodeUnmapper);
}
