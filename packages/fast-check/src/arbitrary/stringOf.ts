import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import type { ArrayConstraintsInternal } from './array';
import { array } from './array';
import type { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { patternsToStringMapper, patternsToStringUnmapperFor } from './_internals/mappers/PatternsToString';
import { createSlicesForStringLegacy } from './_internals/helpers/SlicesForStringBuilder';
export type { StringSharedConstraints } from './_shared/StringSharedConstraints';

const safeObjectAssign = Object.assign;

/**
 * For strings using the characters produced by `charArb`
 *
 * @param charArb - Arbitrary able to generate random strings (possibly multiple characters)
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @deprecated Please use ${@link string} with `fc.string({ unit: charArb, ...constraints })` instead
 * @remarks Since 1.1.3
 * @public
 */
export function stringOf(charArb: Arbitrary<string>, constraints: StringSharedConstraints = {}): Arbitrary<string> {
  const unmapper = patternsToStringUnmapperFor(charArb, constraints);
  const experimentalCustomSlices = createSlicesForStringLegacy(charArb, unmapper);
  // TODO - Move back to object spreading as soon as we bump support from es2017 to es2018+
  const enrichedConstraints: ArrayConstraintsInternal<string> = safeObjectAssign(safeObjectAssign({}, constraints), {
    experimentalCustomSlices,
  });
  return array(charArb, enrichedConstraints).map(patternsToStringMapper, unmapper);
}
