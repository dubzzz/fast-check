import Random from '../../random/generator/Random';
import { stream, Stream } from '../../stream/Stream';
import Arbitrary from './definition/Arbitrary';
import Shrinkable from './definition/Shrinkable';
import { nat } from './IntegerArbitrary';

class ConstantArbitrary<T> extends Arbitrary<T> {
  readonly idArb: Arbitrary<number>;
  constructor(readonly values: T[]) {
    super();
    this.idArb = nat(values.length - 1);
  }
  generate(mrng: Random): Shrinkable<T> {
    if (this.values.length === 1) return new Shrinkable(this.values[0]);

    const id = this.idArb.generate(mrng).value;
    if (id === 0) return new Shrinkable(this.values[0]);

    function* g(v: T) {
      yield new Shrinkable(v);
    }
    return new Shrinkable(this.values[id], () => stream(g(this.values[0])));
  }
}

/**
 * Arbitrary producing only `value`
 * @param value The value to produce
 */
function constant<T>(value: T): Arbitrary<T> {
  return new ConstantArbitrary<T>([value]);
}

/**
 * Arbitrary producing one of `v0` or `...values`.
 * All the values are equiprobable
 *
 * @param v0 One of the value to produce (all values shrink to this one)
 * @param values Other possible values
 */
function constantFrom<T>(v0: T, ...values: T[]): Arbitrary<T> {
  return new ConstantArbitrary<T>([v0, ...values]);
}

export { constant, constantFrom };
