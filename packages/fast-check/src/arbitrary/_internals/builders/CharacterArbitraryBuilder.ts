import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { integer } from '../../integer';
import { indexToCharStringMapper, indexToCharStringUnmapper } from '../mappers/IndexToCharString';

/** @internal */
export function buildCharacterArbitrary(
  min: number,
  max: number,
  mapToCode: (v: number) => number,
  unmapFromCode: (v: number) => number
): Arbitrary<string> {
  return integer({ min, max }).map(
    (n) => indexToCharStringMapper(mapToCode(n)),
    (c) => unmapFromCode(indexToCharStringUnmapper(c))
  );
}
