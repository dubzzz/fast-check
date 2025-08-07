import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { Uint32Array } from '../utils/globals';
import { integer } from './integer';
import type { IntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder';

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
