import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { bigInt } from './bigInt';
import {
  BigIntArrayConstraints,
  typedIntArrayArbitraryArbitraryBuilder,
} from './_internals/builders/TypedIntArrayArbitraryBuilder';

const SBigInt = BigInt;
const SBigInt64Array = BigInt64Array;

/**
 * For BigInt64Array
 * @remarks Since 3.0.0
 * @public
 */
export function bigInt64Array(constraints: BigIntArrayConstraints = {}): Arbitrary<BigInt64Array> {
  return typedIntArrayArbitraryArbitraryBuilder<BigInt64Array, bigint>(
    constraints,
    SBigInt('-9223372036854775808'),
    SBigInt('9223372036854775807'),
    SBigInt64Array,
    bigInt
  );
}
export { BigIntArrayConstraints };
