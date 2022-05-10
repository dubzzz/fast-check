import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { bigInt } from './bigInt';
import {
  BigIntArrayConstraints,
  typedIntArrayArbitraryArbitraryBuilder,
} from './_internals/builders/TypedIntArrayArbitraryBuilder';

/**
 * For BigUint64Array
 * @remarks Since 3.0.0
 * @public
 */
export function bigUint64Array(constraints: BigIntArrayConstraints = {}): Arbitrary<BigUint64Array> {
  return typedIntArrayArbitraryArbitraryBuilder<BigUint64Array, bigint>(
    constraints,
    BigInt(0),
    BigInt('36893488147419103231'),
    BigUint64Array,
    bigInt
  );
}
export { BigIntArrayConstraints };
