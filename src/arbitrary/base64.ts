import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { buildCharacterArbitrary } from './_internals/builders/CharacterArbitraryBuilder';

/** @internal */
function base64Mapper(v: number) {
  if (v < 26) return v + 65; // A-Z
  if (v < 52) return v + 97 - 26; // a-z
  if (v < 62) return v + 48 - 52; // 0-9
  return v === 62 ? 43 : 47; // +/
}

/**
 * For single base64 characters - A-Z, a-z, 0-9, + or /
 * @remarks Since 0.0.1
 * @public
 */
export function base64(): Arbitrary<string> {
  return buildCharacterArbitrary(0, 63, base64Mapper);
}
