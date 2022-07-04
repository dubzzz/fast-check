import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { integer } from '../../integer';
import { numberToPaddedEightMapper, numberToPaddedEightUnmapper } from '../mappers/NumberToPaddedEight';

/** @internal */
export function buildPaddedNumberArbitrary(min: number, max: number): Arbitrary<string> {
  return integer({ min, max }).map(numberToPaddedEightMapper, numberToPaddedEightUnmapper);
}
