import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext } from '../check/arbitrary/definition/Converters';
import { hasCloneMethod } from '../check/symbols';
import { ConstantArbitrary } from './_internals/ConstantArbitrary';

/**
 * For `value`
 * @param value - The value to produce
 * @remarks Since 0.0.1
 * @public
 */
export function constant<T>(value: T): Arbitrary<T> {
  if (hasCloneMethod(value)) {
    throw new Error('fc.constant does not accept cloneable values, use fc.clonedConstant instead');
  }
  return convertFromNext(new ConstantArbitrary([value]));
}
