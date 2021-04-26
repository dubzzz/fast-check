import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { buildCharacterArbitrary } from './_internals/builders/CharacterArbitraryBuilder';
import { preferPrintableMapper } from './_internals/mappers/PreferPrintable';

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

/**
 * For single unicode characters defined in the BMP plan - char code between 0x0000 (included) and 0xffff (included) and without the range 0xd800 to 0xdfff (surrogate pair characters)
 * @remarks Since 0.0.11
 * @public
 */
export function unicode(): Arbitrary<string> {
  return buildCharacterArbitrary(0x0000, 0xffff - gapSize, unicodeMapper);
}
