import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { integer } from './integer';
import {
  IntArrayConstraints,
  typedIntArrayArbitraryArbitraryBuilder,
} from './_internals/builders/TypedIntArrayArbitraryBuilder';

const SInt32Array = Int32Array;

/**
 * For Int32Array
 * @remarks Since 2.9.0
 * @public
 */
export function int32Array(constraints: IntArrayConstraints = {}): Arbitrary<Int32Array> {
  return typedIntArrayArbitraryArbitraryBuilder<Int32Array, number>(
    constraints,
    -0x80000000,
    0x7fffffff,
    SInt32Array,
    integer
  );
}
export { IntArrayConstraints };
