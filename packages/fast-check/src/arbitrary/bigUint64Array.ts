import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { BigInt, BigUint64Array } from '../utils/globals.js';
import { bigInt } from './bigInt.js';
import type { BigIntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';

/**
 * For BigUint64Array
 * @remarks Since 3.0.0
 * @public
 */
export function bigUint64Array(constraints: BigIntArrayConstraints = {}): Arbitrary<BigUint64Array<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<BigUint64Array<ArrayBuffer>, bigint>(
    constraints,
    BigInt(0),
    BigInt('18446744073709551615'),
    BigUint64Array,
    bigInt,
  );
}
export type { BigIntArrayConstraints };
