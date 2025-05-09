import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { safeToUpperCase, safeToLowerCase } from '../utils/globals';
import { MixedCaseArbitrary } from './_internals/MixedCaseArbitrary';

/**
 * Constraints to be applied on {@link mixedCase}
 * @remarks Since 1.17.0
 * @public
 */
export interface MixedCaseConstraints {
  /**
   * Transform a character to its upper and/or lower case version
   * @defaultValue try `toUpperCase` on the received code-point, if no effect try `toLowerCase`
   * @remarks Since 1.17.0
   */
  toggleCase?: (rawChar: string) => string;
  /**
   * In order to be fully reversable (only in case you want to shrink user definable values)
   * you should provide a function taking a string containing possibly toggled items and returning its
   * untoggled version.
   */
  untoggleAll?: (toggledString: string) => string;
}

/** @internal */
function defaultToggleCase(rawChar: string) {
  const upper = safeToUpperCase(rawChar);
  if (upper !== rawChar) return upper;
  return safeToLowerCase(rawChar);
}

/**
 * Randomly switch the case of characters generated by `stringArb` (upper/lower)
 *
 * WARNING:
 * Require bigint support.
 * Under-the-hood the arbitrary relies on bigint to compute the flags that should be toggled or not.
 *
 * @param stringArb - Arbitrary able to build string values
 * @param constraints - Constraints to be applied when computing upper/lower case version
 *
 * @remarks Since 1.17.0
 * @public
 */
export function mixedCase(stringArb: Arbitrary<string>, constraints?: MixedCaseConstraints): Arbitrary<string> {
  const toggleCase = (constraints && constraints.toggleCase) || defaultToggleCase;
  const untoggleAll = constraints && constraints.untoggleAll;
  return new MixedCaseArbitrary(stringArb, toggleCase, untoggleAll);
}
