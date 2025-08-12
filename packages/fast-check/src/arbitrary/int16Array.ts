import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { Int16Array } from '../utils/globals';
import { integer } from './integer';
import type { IntArrayConstraints } from './_internals/builders/TypedIntArrayArbitraryBuilder';
import { typedIntArrayArbitraryArbitraryBuilder } from './_internals/builders/TypedIntArrayArbitraryBuilder';

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
