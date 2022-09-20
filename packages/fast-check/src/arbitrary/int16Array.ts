import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { Int16Array } from '../utils/globals';
import { integer } from './integer';
import {
  IntArrayConstraints,
  typedIntArrayArbitraryArbitraryBuilder,
} from './_internals/builders/TypedIntArrayArbitraryBuilder';

/**
 * For Int16Array
 * @remarks Since 2.9.0
 * @public
 */
export function int16Array(constraints: IntArrayConstraints = {}): Arbitrary<Int16Array> {
  return typedIntArrayArbitraryArbitraryBuilder<Int16Array, number>(constraints, -32768, 32767, Int16Array, integer);
}
export { IntArrayConstraints };
