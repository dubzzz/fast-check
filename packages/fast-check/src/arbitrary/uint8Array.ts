import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { Uint8Array } from '../utils/globals';
import { integer } from './integer';
import type { IntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder';

/**
 * For Uint8Array
 * @remarks Since 2.9.0
 * @public
 */
export function uint8Array(constraints: IntArrayConstraints = {}): Arbitrary<Uint8Array<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<Uint8Array, number>(constraints, 0, 255, Uint8Array, integer);
}
export type { IntArrayConstraints };
