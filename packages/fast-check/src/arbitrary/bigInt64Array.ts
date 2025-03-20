import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { BigInt, BigInt64Array } from '../utils/globals';
import { bigInt } from './bigInt';
import type { BigIntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder';

/**
 * For BigInt64Array
 * @remarks Since 3.0.0
 * @public
 */
export function bigInt64Array(constraints: BigIntArrayConstraints = {}): Arbitrary<BigInt64Array<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<BigInt64Array, bigint>(
    constraints,
    BigInt('-9223372036854775808'),
    BigInt('9223372036854775807'),
    BigInt64Array,
    bigInt,
  );
}
export type { BigIntArrayConstraints };
