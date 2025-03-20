import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { Uint16Array } from '../utils/globals';
import { integer } from './integer';
import type { IntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder';

/**
 * For Uint16Array
 * @remarks Since 2.9.0
 * @public
 */
export function uint16Array(constraints: IntArrayConstraints = {}): Arbitrary<Uint16Array<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<Uint16Array, number>(constraints, 0, 65535, Uint16Array, integer);
}
export type { IntArrayConstraints };
