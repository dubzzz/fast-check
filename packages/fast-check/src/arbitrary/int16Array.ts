import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { Int16Array } from '../utils/globals.js';
import { integer } from './integer.js';
import type { IntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';

/**
 * For Int16Array
 * @remarks Since 2.9.0
 * @public
 */
export function int16Array(constraints: IntArrayConstraints = {}): Arbitrary<Int16Array<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<Int16Array<ArrayBuffer>, number>(
    constraints,
    -32768,
    32767,
    Int16Array,
    integer,
  );
}
export type { IntArrayConstraints };
