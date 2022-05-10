import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { bigInt } from './bigInt';
import {
  BigIntArrayConstraints,
  typedIntArrayArbitraryArbitraryBuilder,
} from './_internals/builders/TypedIntArrayArbitraryBuilder';

/**
 * For BigInt64Array
 * @remarks Since 3.0.0
 * @public
 */
export function bigInt64Array(
  constraints: BigIntArrayConstraints = {}
): Arbitrary<ReturnType<typeof BigInt64Array.from>> {
  return typedIntArrayArbitraryArbitraryBuilder<BigInt64Array, bigint>(
    constraints,
    BigInt('-9223372036854775808'),
    BigInt('9223372036854775807'),
    BigInt64Array,
    bigInt
  );
}
export { BigIntArrayConstraints };
