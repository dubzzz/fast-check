import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext } from '../check/arbitrary/definition/Converters';
import { ConstantArbitrary } from './_internals/ConstantArbitrary';

/**
 * For one `...values` values - all equiprobable
 *
 * **WARNING**: It expects at least one value, otherwise it should throw
 *
 * @param values - Constant values to be produced (all values shrink to the first one)
 */
function constantFrom<T>(...values: T[]): Arbitrary<T>;

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
  return convertFromNext(new ConstantArbitrary(values));
}

export { constantFrom };
