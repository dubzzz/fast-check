import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { integer } from '../../integer.js';
import { WithShrinkFromOtherArbitrary } from '../WithShrinkFromOtherArbitrary.js';

/** @internal */
export function restrictedIntegerArbitraryBuilder(min: number, maxGenerated: number, max: number): Arbitrary<number> {
  const generatorArbitrary = integer({ min, max: maxGenerated });
  if (maxGenerated === max) {
    return generatorArbitrary;
  }
  const shrinkerArbitrary = integer({ min, max });
  return new WithShrinkFromOtherArbitrary(generatorArbitrary, shrinkerArbitrary);
}
