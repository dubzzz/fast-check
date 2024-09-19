import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { buildCharacterArbitrary } from './_internals/builders/CharacterArbitraryBuilder';

/** @internal */
function identity(v: number) {
  return v;
}

/**
 * For single printable ascii characters - char code between 0x20 (included) and 0x7e (included)
 *
 * {@link https://www.ascii-code.com/}
 *
 * @deprecated Please use ${@link string} with `fc.string({ minLength: 1, maxLength: 1 })` instead
 * @remarks Since 0.0.1
 * @public
 */
export function char(): Arbitrary<string> {
  // Only printable characters: https://www.ascii-code.com/
  return buildCharacterArbitrary(0x20, 0x7e, identity, identity);
}
