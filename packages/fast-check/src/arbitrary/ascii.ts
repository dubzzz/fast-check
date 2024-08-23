import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { buildCharacterArbitrary } from './_internals/builders/CharacterArbitraryBuilder';
import { indexToPrintableIndexMapper, indexToPrintableIndexUnmapper } from './_internals/mappers/IndexToPrintableIndex';

/**
 * For single ascii characters - char code between 0x00 (included) and 0x7f (included)
 * @deprecated Please use ${@link string} with `fc.string({ unit: 'binary-ascii', minLength: 1, maxLength: 1 })` instead
 * @remarks Since 0.0.1
 * @public
 */
export function ascii(): Arbitrary<string> {
  return buildCharacterArbitrary(0x00, 0x7f, indexToPrintableIndexMapper, indexToPrintableIndexUnmapper);
}
