import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { integer } from './integer';
import {
  IntArrayConstraints,
  typedIntArrayArbitraryArbitraryBuilder,
} from './_internals/builders/TypedIntArrayArbitraryBuilder';

/**
 * For Uint32Array
 * @remarks Since 2.9.0
 * @public
 */
export function uint32Array(constraints: IntArrayConstraints = {}): Arbitrary<Uint32Array> {
  return typedIntArrayArbitraryArbitraryBuilder<Uint32Array, number>(constraints, 0, 0xffffffff, Uint32Array, integer);
}
export { IntArrayConstraints };
