import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { integer } from '../../integer.js';
import { numberToPaddedEightMapper, numberToPaddedEightUnmapper } from '../mappers/NumberToPaddedEight.js';

/** @internal */
export function buildPaddedNumberArbitrary(min: number, max: number): Arbitrary<string> {
  return integer({ min, max }).map(numberToPaddedEightMapper, numberToPaddedEightUnmapper);
}
