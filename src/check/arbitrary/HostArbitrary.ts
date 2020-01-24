import { array } from './ArrayArbitrary';
import {
  buildAlphaNumericPercentArb,
  buildLowerAlphaArb,
  buildLowerAlphaNumericArb
} from './helpers/SpecificCharacterRange';
import { option } from './OptionArbitrary';
import { stringOf } from './StringArbitrary';
import { tuple } from './TupleArbitrary';

export interface DomainConstraints {
  /**
   * Remove domains starting by xn--
   *
   * NOTE: 'internationalized domains' domains are starting by xn-- .
   *       When not set to true, domain might produce domains starting by xn--
   *       but some of them may not be valid internationalized domains while they still are valid domains.
   */
  excludeInternationalizedDomains?: boolean;
}

/** @hidden */
function subdomain(constraints?: DomainConstraints) {
  const alphaNumericArb = buildLowerAlphaNumericArb([]);
  const alphaNumericHyphenArb = buildLowerAlphaNumericArb(['-']);
  const rawSubdomainArb = tuple(alphaNumericArb, option(tuple(stringOf(alphaNumericHyphenArb), alphaNumericArb)))
    .map(([f, d]) => (d === null ? f : `${f}${d[0]}${d[1]}`))
    .filter(d => d.length <= 63);
  if (constraints && constraints.excludeInternationalizedDomains) {
    // Please note that without this setting some of the generated domains
    // might be invalid according to internationalization rules
    return rawSubdomainArb.filter(d => d.indexOf('xn--') !== 0);
  }
  return rawSubdomainArb;
}

/**
 * For domains
 * having an extension with at least two lowercase characters
 *
 * According to RFC 1034, RFC 1123 and WHATWG URL Standard
 * - https://www.ietf.org/rfc/rfc1034.txt
 * - https://www.ietf.org/rfc/rfc1123.txt
 * - https://url.spec.whatwg.org/
 */
export function domain(constraints?: DomainConstraints) {
  const alphaNumericArb = buildLowerAlphaArb([]);
  const extensionArb = stringOf(alphaNumericArb, 2, 10);
  return tuple(array(subdomain(constraints), 1, 5), extensionArb)
    .map(([mid, ext]) => `${mid.join('.')}.${ext}`)
    .filter(d => d.length <= 255);
}

/** @hidden */
export function hostUserInfo() {
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':'];
  return stringOf(buildAlphaNumericPercentArb(others));
}
