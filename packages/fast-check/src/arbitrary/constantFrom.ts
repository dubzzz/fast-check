import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { ConstantArbitrary } from './_internals/ConstantArbitrary';

/** @internal */
type Arrayfy<T> = T extends any[] ? T : T[];
/** @internal */
type Elem<T> = T extends any[] ? T[number] : T;

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
function constantFrom<const T = never>(...values: T[]): Arbitrary<T>;

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
function constantFrom<TArgs extends any[] | [any]>(...values: TArgs): Arbitrary<TArgs[number]>;

function constantFrom<TArgs extends any[] | [any] | any>(...values: Arrayfy<TArgs>): Arbitrary<Elem<TArgs>> {
  if (values.length === 0) {
    throw new Error('fc.constantFrom expects at least one parameter');
  }
  return new ConstantArbitrary(values) as Arbitrary<Elem<TArgs>>;
}

export { constantFrom };
