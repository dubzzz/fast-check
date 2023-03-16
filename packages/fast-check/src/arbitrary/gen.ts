import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { GeneratorArbitrary } from './_internals/GeneratorArbitrary';
import { GeneratorValue } from './_internals/builders/GeneratorValueBuilder';

export { GeneratorValue as GeneratorValue };
export function gen(): Arbitrary<GeneratorValue> {
  return new GeneratorArbitrary();
}
