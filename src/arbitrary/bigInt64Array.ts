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
export function bigInt64Array(constraints: BigIntArrayConstraints = {}): Arbitrary<BigInt64Array> {
  return typedIntArrayArbitraryArbitraryBuilder<BigInt64Array, bigint>(
    constraints,
    BigInt('-18446744073709551616'),
    BigInt('18446744073709551615'),
    BigInt64Array,
    bigInt
  );
}
export { BigIntArrayConstraints };
