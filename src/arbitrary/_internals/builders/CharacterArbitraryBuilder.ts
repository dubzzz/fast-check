import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../../../check/arbitrary/definition/Converters';
import { integer } from '../../integer';
import { indexToCharStringMapper, indexToCharStringUnmapper } from '../mappers/IndexToCharString';

/** @internal */
export function buildCharacterArbitrary(
  min: number,
  max: number,
  mapToCode: (v: number) => number,
  unmapFromCode: (v: number) => number
): Arbitrary<string> {
  return convertFromNext(
    convertToNext(integer({ min, max })).map(
      (n) => indexToCharStringMapper(mapToCode(n)),
      (c) => unmapFromCode(indexToCharStringUnmapper(c))
    )
  );
}
