import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { Uint8ClampedArray as SUint8ClampedArray } from '../utils/globals.js';
import { integer } from './integer.js';
import type { IntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder.js';

/**
 * For Uint8ClampedArray
 * @remarks Since 2.9.0
 * @public
 */
export function uint8ClampedArray(constraints: IntArrayConstraints = {}): Arbitrary<Uint8ClampedArray<ArrayBuffer>> {
  return typedIntArrayArbitraryArbitraryBuilder<Uint8ClampedArray<ArrayBuffer>, number>(
    constraints,
    0,
    255,
    SUint8ClampedArray,
    integer,
  );
}
export type { IntArrayConstraints };
