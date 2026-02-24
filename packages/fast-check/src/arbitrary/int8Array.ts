import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { Int8Array as SInt8Array } from '../utils/globals.js';
import { integer } from './integer.js';
import type { IntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';

/**
 * For Int8Array
 * @remarks Since 2.9.0
 * @public
 */
export function int8Array(constraints: IntArrayConstraints = {}): Arbitrary<Int8Array<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<Int8Array<ArrayBuffer>, number>(
    constraints,
    -128,
    127,
    SInt8Array,
    integer,
  );
}
export type { IntArrayConstraints };
