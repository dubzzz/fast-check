import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { getOrCreateAlphaNumericPercentArbitrary } from './_internals/builders/CharacterRangeArbitraryBuilder';
import { string } from './string';
import type { SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength';

/**
 * Constraints to be applied on {@link webSegment}
 * @remarks Since 2.22.0
 * @public
 */
export interface WebSegmentConstraints {
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 2.22.0
   */
  size?: Exclude<SizeForArbitrary, 'max'>;
}

/**
 * For internal segment of an URI (web included)
 *
 * According to {@link https://www.ietf.org/rfc/rfc3986.txt | RFC 3986}
 *
 * eg.: In the url `https://github.com/dubzzz/fast-check/`, `dubzzz` and `fast-check` are segments
 *
 * @param constraints - Constraints to apply when building instances (since 2.22.0)
 *
 * @remarks Since 1.14.0
 * @public
 */
export function webSegment(constraints: WebSegmentConstraints = {}): Arbitrary<string> {
  // pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
  // segment       = *pchar
  return string({ unit: getOrCreateAlphaNumericPercentArbitrary("-._~!$&'()*+,;=:@"), size: constraints.size });
}
