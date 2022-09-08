import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { integer } from './integer';
import {
  IntArrayConstraints,
  typedIntArrayArbitraryArbitraryBuilder,
} from './_internals/builders/TypedIntArrayArbitraryBuilder';

const SInt16Array = Int16Array;

/**
 * For Int16Array
 * @remarks Since 2.9.0
 * @public
 */
export function int16Array(constraints: IntArrayConstraints = {}): Arbitrary<Int16Array> {
  return typedIntArrayArbitraryArbitraryBuilder<Int16Array, number>(constraints, -32768, 32767, SInt16Array, integer);
}
export { IntArrayConstraints };
