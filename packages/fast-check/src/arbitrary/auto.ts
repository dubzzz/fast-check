import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { AutoArbitrary } from './_internals/AutoArbitrary';
import { AutoValue } from './_internals/builders/AutoValueBuilder';

export function auto(): Arbitrary<AutoValue> {
  return new AutoArbitrary();
}
