import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { BigInt, BigUint64Array } from '../utils/globals';
import { bigInt } from './bigInt';
import type { BigIntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder';

/**
 * For BigUint64Array
 * @remarks Since 3.0.0
 * @public
 */
export function bigUint64Array(constraints: BigIntArrayConstraints = {}): Arbitrary<BigUint64Array<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<BigUint64Array, bigint>(
    constraints,
    BigInt(0),
    BigInt('18446744073709551615'),
    BigUint64Array,
    bigInt,
  );
}
export type { BigIntArrayConstraints };
