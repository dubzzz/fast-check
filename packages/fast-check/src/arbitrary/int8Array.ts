import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { integer } from './integer';
import {
  IntArrayConstraints,
  typedIntArrayArbitraryArbitraryBuilder,
} from './_internals/builders/TypedIntArrayArbitraryBuilder';

const SInt8Array = Int8Array;

/**
 * For Int8Array
 * @remarks Since 2.9.0
 * @public
 */
export function int8Array(constraints: IntArrayConstraints = {}): Arbitrary<Int8Array> {
  return typedIntArrayArbitraryArbitraryBuilder<Int8Array, number>(constraints, -128, 127, SInt8Array, integer);
}
export { IntArrayConstraints };
