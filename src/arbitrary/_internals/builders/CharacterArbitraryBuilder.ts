import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { integer } from '../../integer';

/** @internal */
export function buildCharacterArbitrary(min: number, max: number, mapToCode: (v: number) => number): Arbitrary<string> {
  return integer(min, max).map((n) => String.fromCodePoint(mapToCode(n)));
}
