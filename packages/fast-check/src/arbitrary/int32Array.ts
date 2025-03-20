import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { Int32Array } from '../utils/globals';
import { integer } from './integer';
import type { IntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder';

/**
 * For Int32Array
 * @remarks Since 2.9.0
 * @public
 */
export function int32Array(constraints: IntArrayConstraints = {}): Arbitrary<Int32Array<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<Int32Array, number>(
    constraints,
    -0x80000000,
    0x7fffffff,
    Int32Array,
    integer,
  );
}
export type { IntArrayConstraints };
