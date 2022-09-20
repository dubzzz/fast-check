import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { Int8Array } from '../utils/globals';
import { integer } from './integer';
import {
  IntArrayConstraints,
  typedIntArrayArbitraryArbitraryBuilder,
} from './_internals/builders/TypedIntArrayArbitraryBuilder';

/**
 * For Int8Array
 * @remarks Since 2.9.0
 * @public
 */
export function int8Array(constraints: IntArrayConstraints = {}): Arbitrary<Int8Array> {
  return typedIntArrayArbitraryArbitraryBuilder<Int8Array, number>(constraints, -128, 127, Int8Array, integer);
}
export { IntArrayConstraints };
