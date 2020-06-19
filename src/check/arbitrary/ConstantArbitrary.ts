import { Random } from '../../random/generator/Random';
import { stream } from '../../stream/Stream';
import { cloneMethod, hasCloneMethod } from '../symbols';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';
import { findOrUndefined } from './helpers/ArrayHelper';

/** @internal */
class ConstantArbitrary<T> extends Arbitrary<T> {
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
  if (hasCloneMethod(value)) {
    throw new Error('fc.constant does not accept cloneable values, use fc.clonedConstant instead');
  }
  return new ConstantArbitrary<T>([value]);
}

/**
 * For `value`
 * @param value The value to produce
 */
function clonedConstant<T>(value: T): Arbitrary<T> {
  if (hasCloneMethod(value)) {
    const producer = () => value[cloneMethod]();
    return new ConstantArbitrary([producer]).map((c) => c());
  }
  return new ConstantArbitrary<T>([value]);
}

/**
 * For one `...values` values - all equiprobable
 *
 * **WARNING**: It expects at least one value, otherwise it should throw
 *
 * @param values Constant values to be produced (all values shrink to the first one)
 */
function constantFrom<TArgs extends any[] | [any]>(...values: TArgs): Arbitrary<TArgs[number]> {
  if (values.length === 0) {
    throw new Error('fc.constantFrom expects at least one parameter');
  }
  if (findOrUndefined(values, (v) => hasCloneMethod(v)) != undefined) {
    throw new Error('fc.constantFrom does not accept cloneable values, not supported for the moment');
  }
  return new ConstantArbitrary<TArgs[number]>([...values]);
}

export { clonedConstant, constant, constantFrom };
