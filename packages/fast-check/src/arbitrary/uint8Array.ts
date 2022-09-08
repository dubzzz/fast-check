import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { integer } from './integer';
import {
  IntArrayConstraints,
  typedIntArrayArbitraryArbitraryBuilder,
} from './_internals/builders/TypedIntArrayArbitraryBuilder';

const SUint8Array = Uint8Array;

/**
 * For Uint8Array
 * @remarks Since 2.9.0
 * @public
 */
export function uint8Array(constraints: IntArrayConstraints = {}): Arbitrary<Uint8Array> {
  return typedIntArrayArbitraryArbitraryBuilder<Uint8Array, number>(constraints, 0, 255, SUint8Array, integer);
}
export { IntArrayConstraints };
