import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../../../check/arbitrary/definition/Converters';
import { integer } from '../../integer';
import { WithShrinkFromOtherArbitrary } from '../WithShrinkFromOtherArbitrary';

/** @internal */
export function restrictedIntegerArbitraryBuilder(min: number, maxGenerated: number, max: number): Arbitrary<number> {
  const generatorArbitrary = convertToNext(integer({ min, max: maxGenerated }));
  if (maxGenerated === max) {
    return convertFromNext(generatorArbitrary);
  }
  const shrinkerArbitrary = convertToNext(integer({ min, max }));
  return convertFromNext(new WithShrinkFromOtherArbitrary(generatorArbitrary, shrinkerArbitrary));
}
