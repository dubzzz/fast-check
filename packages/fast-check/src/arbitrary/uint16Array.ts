import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { integer } from './integer';
import {
  IntArrayConstraints,
  typedIntArrayArbitraryArbitraryBuilder,
} from './_internals/builders/TypedIntArrayArbitraryBuilder';

/**
 * For Uint16Array
 * @remarks Since 2.9.0
 * @public
 */
export function uint16Array(constraints: IntArrayConstraints = {}): Arbitrary<Uint16Array> {
  return typedIntArrayArbitraryArbitraryBuilder<Uint16Array, number>(constraints, 0, 65535, Uint16Array, integer);
}
export { IntArrayConstraints };
