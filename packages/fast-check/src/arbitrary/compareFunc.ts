import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { buildCompareFunctionArbitrary } from './_internals/builders/CompareFunctionArbitraryBuilder';

const safeAssign = Object.assign.bind(Object);

/**
 * For comparison functions
 *
 * A comparison function returns:
 * - negative value whenever `a < b`
 * - positive value whenever `a > b`
 * - zero whenever `a` and `b` are equivalent
 *
 * Comparison functions are transitive: `a < b and b < c => a < c`
 *
 * They also satisfy: `a < b <=> b > a` and `a = b <=> b = a`
 *
 * @remarks Since 1.6.0
 * @public
 */
export function compareFunc<T>(): Arbitrary<(a: T, b: T) => number> {
  return buildCompareFunctionArbitrary(
    safeAssign((hA: number, hB: number) => hA - hB, {
      toString() {
        // istanbul coverage tool may override the function for its needs (thus its string representation)
        // assigning explicitly a toString representation avoids this issue
        return '(hA, hB) => hA - hB';
      },
    })
  );
}
