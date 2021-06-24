import { array } from './array';
import {
  buildLowerAlphaArbitrary,
  buildLowerAlphaNumericArbitrary,
} from './_internals/builders/CharacterRangeArbitraryBuilder';
import { option } from './option';
import { stringOf } from './stringOf';
import { tuple } from './tuple';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { filterInvalidSubdomainLabel } from './_internals/helpers/InvalidSubdomainLabelFiIter';

/** @internal */
function subdomainLabel() {
  const alphaNumericArb = buildLowerAlphaNumericArbitrary([]);
  const alphaNumericHyphenArb = buildLowerAlphaNumericArbitrary(['-']);
  // Rq: maxLength = 61 because max length of a label is 63 according to RFC 1034
  //     and we add 2 characters to this generated value
  return tuple(alphaNumericArb, option(tuple(stringOf(alphaNumericHyphenArb, { maxLength: 61 }), alphaNumericArb)))
    .map(([f, d]) => (d === null ? f : `${f}${d[0]}${d[1]}`))
    .filter(filterInvalidSubdomainLabel);
}

/**
 * For domains
 * having an extension with at least two lowercase characters
 *
 * According to {@link https://www.ietf.org/rfc/rfc1034.txt | RFC 1034},
 * {@link https://www.ietf.org/rfc/rfc1035.txt | RFC 1035},
 * {@link https://www.ietf.org/rfc/rfc1123.txt | RFC 1123} and
 * {@link https://url.spec.whatwg.org/ | WHATWG URL Standard}
 *
 * @remarks Since 1.14.0
 * @public
 */
export function domain(): Arbitrary<string> {
  const alphaNumericArb = buildLowerAlphaArbitrary([]);
  // A list of public suffixes can be found here: https://publicsuffix.org/list/public_suffix_list.dat
  // our current implementation does not follwo this list and generate a fully randomized suffix
  // which is probably not in this list (probability would be low)
  const publicSuffixArb = stringOf(alphaNumericArb, { minLength: 2, maxLength: 10 });
  return (
    tuple(array(subdomainLabel(), { minLength: 1, maxLength: 5 }), publicSuffixArb)
      .map(([mid, ext]) => `${mid.join('.')}.${ext}`)
      // Required by RFC 1034:
      //    To simplify implementations, the total number of octets that represent
      //    a domain name (i.e., the sum of all label octets and label lengths) is limited to 255.
      // It seems that this restriction has been relaxed in modern web browsers.
      .filter((d) => d.length <= 255)
  );
}
