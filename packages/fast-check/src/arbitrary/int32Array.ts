import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { Int32Array as SInt32Array } from '../utils/globals.js';
import { integer } from './integer.js';
import type { IntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';

/**
 * For Int32Array
 * @remarks Since 2.9.0
 * @public
 */
export function int32Array(constraints: IntArrayConstraints = {}): Arbitrary<Int32Array<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<Int32Array<ArrayBuffer>, number>(
    constraints,
    -0x80000000,
    0x7fffffff,
    SInt32Array,
    integer,
  );
}
export type { IntArrayConstraints };
