import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { Uint8Array } from '../utils/globals.js';
import { integer } from './integer.js';
import type { IntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';

/**
 * For Uint8Array
 * @remarks Since 2.9.0
 * @public
 */
export function uint8Array(constraints: IntArrayConstraints = {}): Arbitrary<Uint8Array<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<Uint8Array<ArrayBuffer>, number>(
    constraints,
    0,
    255,
    Uint8Array,
    integer,
  );
}
export type { IntArrayConstraints };
