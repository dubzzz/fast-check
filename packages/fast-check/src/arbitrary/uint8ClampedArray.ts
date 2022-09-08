import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { integer } from './integer';
import {
  IntArrayConstraints,
  typedIntArrayArbitraryArbitraryBuilder,
} from './_internals/builders/TypedIntArrayArbitraryBuilder';

const SUint8ClampedArray = Uint8ClampedArray;

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
    SUint8ClampedArray,
    integer
  );
}
export { IntArrayConstraints };
