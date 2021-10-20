import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { buildCharacterArbitrary } from './_internals/builders/CharacterArbitraryBuilder';

/** @internal */
function hexaMapper(v: number): number {
  return v < 10
    ? v + 48 // 0-9
    : v + 97 - 10; // a-f
}

/** @internal */
function hexaUnmapper(v: number): number {
  return v < 58
    ? v - 48 // 0-9
    : v >= 97 && v < 103
    ? v - 97 + 10 // a-f
    : -1; // invalid: out of scope
}

/**
 * For single hexadecimal characters - 0-9 or a-f
 * @remarks Since 0.0.1
 * @public
 */
export function hexa(): Arbitrary<string> {
  return buildCharacterArbitrary(0, 15, hexaMapper, hexaUnmapper);
}
