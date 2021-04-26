import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { buildCharacterArbitrary } from './_internals/builders/CharacterArbitraryBuilder';
import { preferPrintableMapper } from './_internals/mappers/PreferPrintable';

/**
 * For single ascii characters - char code between 0x00 (included) and 0x7f (included)
 * @remarks Since 0.0.1
 * @public
 */
export function ascii(): Arbitrary<string> {
  return buildCharacterArbitrary(0x00, 0x7f, preferPrintableMapper);
}
