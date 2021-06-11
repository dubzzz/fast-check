import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { buildCompareFunctionArbitrary } from './_internals/builders/CompareFunctionArbitraryBuilder';

/**
 * For comparison boolean functions
 *
 * A comparison boolean function returns:
 * - `true` whenever `a < b`
 * - `false` otherwise (ie. `a = b` or `a > b`)
 *
 * @remarks Since 1.6.0
 * @public
 */
export function compareBooleanFunc<T>(): Arbitrary<(a: T, b: T) => boolean> {
  return buildCompareFunctionArbitrary(
    Object.assign((hA: number, hB: number) => hA < hB, {
      toString() {
        // istanbul coverage tool may override the function for its needs (thus its string representation)
        // assigning explicitly a toString representation avoids this issue
        return '(hA, hB) => hA < hB';
      },
    })
  );
}
