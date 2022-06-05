import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { integer } from './integer';
import {
  IntArrayConstraints,
  typedIntArrayArbitraryArbitraryBuilder,
} from './_internals/builders/TypedIntArrayArbitraryBuilder';

/**
 * For Uint8ClampedArray
 * @remarks Since 2.9.0
 * @public
 */
export function uint8ClampedArray(constraints: IntArrayConstraints = {}): Arbitrary<Uint8ClampedArray> {
  return typedIntArrayArbitraryArbitraryBuilder<Uint8ClampedArray, number>(
    constraints,
    0,
    255,
    Uint8ClampedArray,
    integer
  );
}
export { IntArrayConstraints };
