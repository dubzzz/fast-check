import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { buildUriQueryOrFragmentArbitrary } from './_internals/builders/UriQueryOrFragmentArbitraryBuilder';

/**
 * For fragments of an URI (web included)
 *
 * According to {@link https://www.ietf.org/rfc/rfc3986.txt | RFC 3986}
 *
 * eg.: In the url `https://domain/plop?page=1#hello=1&world=2`, `?hello=1&world=2` are query parameters
 *
 * @remarks Since 1.14.0
 * @public
 */
export function webFragments(): Arbitrary<string> {
  return buildUriQueryOrFragmentArbitrary();
}
