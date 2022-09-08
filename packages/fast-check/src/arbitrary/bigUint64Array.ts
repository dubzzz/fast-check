import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { bigInt } from './bigInt';
import {
  BigIntArrayConstraints,
  typedIntArrayArbitraryArbitraryBuilder,
} from './_internals/builders/TypedIntArrayArbitraryBuilder';

const SBigInt = BigInt;
const SBigUint64Array = BigUint64Array;

/**
 * For BigUint64Array
 * @remarks Since 3.0.0
 * @public
 */
export function bigUint64Array(constraints: BigIntArrayConstraints = {}): Arbitrary<BigUint64Array> {
  return typedIntArrayArbitraryArbitraryBuilder<BigUint64Array, bigint>(
    constraints,
    SBigInt(0),
    SBigInt('18446744073709551615'),
    SBigUint64Array,
    bigInt
  );
}
export { BigIntArrayConstraints };
