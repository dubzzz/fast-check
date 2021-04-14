import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { cloneMethod, hasCloneMethod } from '../symbols';
import { Arbitrary } from './definition/Arbitrary';
import { convertFromNext } from './definition/Converters';
import { NextArbitrary } from './definition/NextArbitrary';
import { NextValue } from './definition/NextValue';

/** @internal */
class ConstantArbitrary<T> extends NextArbitrary<T> {
  constructor(readonly values: T[]) {
    super();
  }
  generate(mrng: Random, _biasFactor: number | undefined): NextValue<T> {
    if (this.values.length === 1) {
      return new NextValue(this.values[0], 0);
    }
    const idx = mrng.nextInt(0, this.values.length - 1);
    return new NextValue(this.values[idx], idx);
  }
  canGenerate(value: unknown): value is T {
    for (let idx = 0; idx !== this.values.length; ++idx) {
      if (Object.is(this.values[idx], value)) {
        return true;
      }
    }
    return false;
  }
  shrink(value: T, context?: unknown): Stream<NextValue<T>> {
    if (context === 0 || value === this.values[0]) {
      return Stream.nil();
    }
    return Stream.of(new NextValue(this.values[0], 0));
  }
}

/**
 * For `value`
 * @param value - The value to produce
 * @remarks Since 0.0.1
 * @public
 */
function constant<T>(value: T): Arbitrary<T> {
  if (hasCloneMethod(value)) {
    throw new Error('fc.constant does not accept cloneable values, use fc.clonedConstant instead');
  }
  return convertFromNext(
    new ConstantArbitrary<T>([value])
  );
}

/**
 * For `value`
 * @param value - The value to produce
 * @remarks Since 1.8.0
 * @public
 */
function clonedConstant<T>(value: T): Arbitrary<T> {
  if (hasCloneMethod(value)) {
    const producer = () => value[cloneMethod]();
    return convertFromNext(new ConstantArbitrary([producer]).map((c) => c()));
  }
  return convertFromNext(
    new ConstantArbitrary<T>([value])
  );
}

/**
 * For one `...values` values - all equiprobable
 *
 * **WARNING**: It expects at least one value, otherwise it should throw
 *
 * @param values - Constant values to be produced (all values shrink to the first one)
 *
 * @remarks Since 0.0.12
 * @public
 */
function constantFrom<TArgs extends any[] | [any]>(...values: TArgs): Arbitrary<TArgs[number]> {
  if (values.length === 0) {
    throw new Error('fc.constantFrom expects at least one parameter');
  }
  if (values.find((v) => hasCloneMethod(v)) != undefined) {
    throw new Error('fc.constantFrom does not accept cloneable values, not supported for the moment');
  }
  return convertFromNext(
    new ConstantArbitrary<TArgs[number]>([...values])
  );
}

export { clonedConstant, constant, constantFrom };
