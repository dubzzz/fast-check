import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { Uint8ClampedArray } from '../utils/globals';
import { integer } from './integer';
import type { IntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder';

/**
 * For Uint8ClampedArray
 * @remarks Since 2.9.0
 * @public
 */
export function uint8ClampedArray(constraints: IntArrayConstraints = {}): Arbitrary<Uint8ClampedArray<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<Uint8ClampedArray, number>(
    constraints,
    0,
    255,
    Uint8ClampedArray,
    integer,
  );
}
export type { IntArrayConstraints };
