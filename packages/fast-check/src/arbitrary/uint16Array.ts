import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { Uint16Array } from '../utils/globals.js';
import { integer } from './integer.js';
import type { IntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';

/**
 * For Uint16Array
 * @remarks Since 2.9.0
 * @public
 */
export function uint16Array(constraints: IntArrayConstraints = {}): Arbitrary<Uint16Array<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<Uint16Array<ArrayBuffer>, number>(
    constraints,
    0,
    65535,
    Uint16Array,
    integer,
  );
}
export type { IntArrayConstraints };
