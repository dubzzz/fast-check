import Random from '../../random/generator/Random';
import { stream, Stream } from '../../stream/Stream';
import Arbitrary from './definition/Arbitrary';
import Shrinkable from './definition/Shrinkable';

/** @hidden */
class ConstantArbitrary<T> extends Arbitrary<T> {
  readonly idArb: Arbitrary<number>;
  constructor(readonly values: T[]) {
    super();
  }
  generate(mrng: Random): Shrinkable<T> {
    if (this.values.length === 1) return new Shrinkable(this.values[0]);

    const id = mrng.nextInt(0, this.values.length - 1);
    if (id === 0) return new Shrinkable(this.values[0]);

    function* g(v: T) {
      yield new Shrinkable(v);
    }
    return new Shrinkable(this.values[id], () => stream(g(this.values[0])));
  }
}

/**
 * For `value`
 * @param value The value to produce
 */
function constant<T>(value: T): Arbitrary<T> {
  return new ConstantArbitrary<T>([value]);
}

/**
 * For one `...values` values - all equiprobable
 *
 * **WARNING**: It expects at least one value, otherwise it should throw
 *
 * @param values Constant values to be produced (all values shrink to the first one)
 */
function constantFrom<T>(...values: T[]): Arbitrary<T> {
  if (values.length === 0) {
    throw new Error('fc.constantFrom expects at least one parameter');
  }
  return new ConstantArbitrary<T>([...values]);
}

export { constant, constantFrom };
