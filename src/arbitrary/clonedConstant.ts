import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext } from '../check/arbitrary/definition/Converters';
import { cloneMethod, hasCloneMethod } from '../check/symbols';
import { ConstantArbitrary } from './_internals/ConstantArbitrary';

/**
 * For `value`
 * @param value - The value to produce
 * @remarks Since 1.8.0
 * @public
 */
export function clonedConstant<T>(value: T): Arbitrary<T> {
  if (hasCloneMethod(value)) {
    const producer = () => value[cloneMethod]();
    return convertFromNext(new ConstantArbitrary([producer]).map((c) => c()));
  }
  return convertFromNext(new ConstantArbitrary([value]));
}
