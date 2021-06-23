import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../../../check/arbitrary/definition/Converters';
import { integer } from '../../integer';
import { numberToPaddedEightMapper, numberToPaddedEightUnmapper } from '../mappers/NumberToPaddedEight';

/** @internal */
export function buildPaddedNumberArbitrary(min: number, max: number): Arbitrary<string> {
  return convertFromNext(
    convertToNext(integer({ min, max })).map(numberToPaddedEightMapper, numberToPaddedEightUnmapper)
  );
}
