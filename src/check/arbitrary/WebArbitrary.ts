import { array } from '../../arbitrary/array';
import { constantFrom } from './ConstantArbitrary';
import { constant } from './ConstantArbitrary';
import { buildAlphaNumericPercentArb } from './helpers/SpecificCharacterRange';
import { domain, hostUserInfo } from './HostArbitrary';
import { nat } from '../../arbitrary/nat';
import { ipV4, ipV4Extended, ipV6 } from './IpArbitrary';
import { oneof } from '../../arbitrary/oneof';
import { option } from '../../arbitrary/option';
import { stringOf } from './StringArbitrary';
import { tuple } from '../../arbitrary/tuple';
import { Arbitrary } from './definition/Arbitrary';

/**
 * Constraints to be applied on {@link webAuthority}
 * @remarks Since 1.14.0
 * @public
 */
export interface WebAuthorityConstraints {
  /**
   * Enable IPv4 in host
   * @remarks Since 1.14.0
   */
  withIPv4?: boolean;
  /**
   * Enable IPv6 in host
   * @remarks Since 1.14.0
   */
  withIPv6?: boolean;
  /**
   * Enable extended IPv4 format
   * @remarks Since 1.17.0
   */
  withIPv4Extended?: boolean;
  /**
   * Enable user information prefix
   * @remarks Since 1.14.0
   */
  withUserInfo?: boolean;
  /**
   * Enable port suffix
   * @remarks Since 1.14.0
   */
  withPort?: boolean;
}

/**
 * For web authority
 *
 * According to {@link https://www.ietf.org/rfc/rfc3986.txt | RFC 3986} - `authority = [ userinfo "@" ] host [ ":" port ]`
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 1.14.0
 * @public
 */
export function webAuthority(constraints?: WebAuthorityConstraints): Arbitrary<string> {
  const c = constraints || {};
  const hostnameArbs = [domain()]
    .concat(c.withIPv4 === true ? [ipV4()] : [])
    .concat(c.withIPv6 === true ? [ipV6().map((ip) => `[${ip}]`)] : [])
    .concat(c.withIPv4Extended === true ? [ipV4Extended()] : []);
  return tuple(
    c.withUserInfo === true ? option(hostUserInfo()) : constant(null),
    oneof(...hostnameArbs),
    c.withPort === true ? option(nat(65535)) : constant(null)
  ).map(([u, h, p]) => (u === null ? '' : `${u}@`) + h + (p === null ? '' : `:${p}`));
}

/**
 * For internal segment of an URI (web included)
 *
 * According to {@link https://www.ietf.org/rfc/rfc3986.txt | RFC 3986}
 *
 * eg.: In the url `https://github.com/dubzzz/fast-check/`, `dubzzz` and `fast-check` are segments
 *
 * @remarks Since 1.14.0
 * @public
 */
export function webSegment(): Arbitrary<string> {
  // pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
  // segment       = *pchar
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':', '@'];
  return stringOf(buildAlphaNumericPercentArb(others));
}

/** @internal */
function uriQueryOrFragment() {
  // query         = *( pchar / "/" / "?" )
  // fragment      = *( pchar / "/" / "?" )
  const others = ['-', '.', '_', '~', '!', '$', '&', "'", '(', ')', '*', '+', ',', ';', '=', ':', '@', '/', '?'];
  return stringOf(buildAlphaNumericPercentArb(others));
}

/**
 * For query parameters of an URI (web included)
 *
 * According to {@link https://www.ietf.org/rfc/rfc3986.txt | RFC 3986}
 *
 * eg.: In the url `https://domain/plop/?hello=1&world=2`, `?hello=1&world=2` are query parameters
 *
 * @remarks Since 1.14.0
 * @public
 */
export function webQueryParameters(): Arbitrary<string> {
  return uriQueryOrFragment();
}

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
  return uriQueryOrFragment();
}

/**
 * Constraints to be applied on {@link webUrl}
 * @remarks Since 1.14.0
 * @public
 */
export interface WebUrlConstraints {
  /**
   * Enforce specific schemes, eg.: http, https
   * @remarks Since 1.14.0
   */
  validSchemes?: string[];
  /**
   * Settings for {@link webAuthority}
   * @remarks Since 1.14.0
   */
  authoritySettings?: WebAuthorityConstraints;
  /**
   * Enable query parameters in the generated url
   * @remarks Since 1.14.0
   */
  withQueryParameters?: boolean;
  /**
   * Enable fragments in the generated url
   * @remarks Since 1.14.0
   */
  withFragments?: boolean;
}

/**
 * For web url
 *
 * According to {@link https://www.ietf.org/rfc/rfc3986.txt | RFC 3986} and
 * {@link https://url.spec.whatwg.org/ | WHATWG URL Standard}
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 1.14.0
 * @public
 */
export function webUrl(constraints?: WebUrlConstraints): Arbitrary<string> {
  const c = constraints || {};
  const validSchemes = c.validSchemes || ['http', 'https'];
  const schemeArb = constantFrom(...validSchemes);
  const authorityArb = webAuthority(c.authoritySettings);
  const pathArb = array(webSegment()).map((p) => p.map((v) => `/${v}`).join(''));
  return tuple(
    schemeArb,
    authorityArb,
    pathArb,
    c.withQueryParameters === true ? option(webQueryParameters()) : constant(null),
    c.withFragments === true ? option(webFragments()) : constant(null)
  ).map(([s, a, p, q, f]) => `${s}://${a}${p}${q === null ? '' : `?${q}`}${f === null ? '' : `#${f}`}`);
}
