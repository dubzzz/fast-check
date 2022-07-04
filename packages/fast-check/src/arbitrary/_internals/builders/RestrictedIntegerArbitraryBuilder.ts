import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { integer } from '../../integer';
import { WithShrinkFromOtherArbitrary } from '../WithShrinkFromOtherArbitrary';

/** @internal */
export function restrictedIntegerArbitraryBuilder(min: number, maxGenerated: number, max: number): Arbitrary<number> {
  const generatorArbitrary = integer({ min, max: maxGenerated });
  if (maxGenerated === max) {
    return generatorArbitrary;
  }
  const shrinkerArbitrary = integer({ min, max });
  return new WithShrinkFromOtherArbitrary(generatorArbitrary, shrinkerArbitrary);
}
