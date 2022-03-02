import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { buildUriQueryOrFragmentArbitrary } from './_internals/builders/UriQueryOrFragmentArbitraryBuilder';
import { SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength';

/**
 * Constraints to be applied on {@link webQueryParameters}
 * @remarks Since 2.22.0
 * @public
 */
export interface WebQueryParametersConstraints {
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 2.22.0
   */
  size?: Exclude<SizeForArbitrary, 'max'>;
}

/**
 * For query parameters of an URI (web included)
 *
 * According to {@link https://www.ietf.org/rfc/rfc3986.txt | RFC 3986}
 *
 * eg.: In the url `https://domain/plop/?hello=1&world=2`, `?hello=1&world=2` are query parameters
 *
 * @param constraints - Constraints to apply when building instances (since 2.22.0)
 *
 * @remarks Since 1.14.0
 * @public
 */
export function webQueryParameters(constraints: WebQueryParametersConstraints = {}): Arbitrary<string> {
  return buildUriQueryOrFragmentArbitrary(constraints.size);
}
