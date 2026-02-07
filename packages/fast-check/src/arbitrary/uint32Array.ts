import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { Uint32Array } from '../utils/globals.js';
import { integer } from './integer.js';
import type { IntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';

/**
 * For Uint32Array
 * @remarks Since 2.9.0
 * @public
 */
export function uint32Array(constraints: IntArrayConstraints = {}): Arbitrary<Uint32Array<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<Uint32Array<ArrayBuffer>, number>(
    constraints,
    0,
    0xffffffff,
    Uint32Array,
    integer,
  );
}
export type { IntArrayConstraints };
