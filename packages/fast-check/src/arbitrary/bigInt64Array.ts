import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { BigInt, BigInt64Array } from '../utils/globals.js';
import { bigInt } from './bigInt.js';
import type { BigIntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';

/**
 * For BigInt64Array
 * @remarks Since 3.0.0
 * @public
 */
export function bigInt64Array(constraints: BigIntArrayConstraints = {}): Arbitrary<BigInt64Array<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<BigInt64Array<ArrayBuffer>, bigint>(
    constraints,
    BigInt('-9223372036854775808'),
    BigInt('9223372036854775807'),
    BigInt64Array,
    bigInt,
  );
}
export type { BigIntArrayConstraints };
