import { array } from './ArrayArbitrary';
import { constantFrom } from './ConstantArbitrary';
import { constant } from './ConstantArbitrary';
import { buildAlphaNumericPercentArb } from './helpers/SpecificCharacterRange';
import { domain, hostUserInfo } from './HostArbitrary';
import { nat } from './IntegerArbitrary';
import { ipV4, ipV4Extended, ipV6 } from './IpArbitrary';
import { oneof } from './OneOfArbitrary';
import { option } from './OptionArbitrary';
import { stringOf } from './StringArbitrary';
import { tuple } from './TupleArbitrary';

export interface WebAuthorityConstraints {
  /** Enable IPv4 in host */
  withIPv4?: boolean;
  /** Enable IPv6 in host */
  withIPv6?: boolean;
  /** Enable extended IPv4 format */
  withIPv4Extended?: boolean;
  /** Enable user information prefix */
  withUserInfo?: boolean;
  /** Enable port suffix */
  withPort?: boolean;
}

/**
 * For web authority
 *
 * According to RFC 3986 - https://www.ietf.org/rfc/rfc3986.txt - `authority = [ userinfo "@" ] host [ ":" port ]`
 *
 * @param constraints
 */
export function webAuthority(constraints?: WebAuthorityConstraints) {
  const c = constraints || {};
  const hostnameArbs = [domain()]
    .concat(c.withIPv4 === true ? [ipV4()] : [])
    .concat(c.withIPv6 === true ? [ipV6().map(ip => `[${ip}]`)] : [])
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
 * According to RFC 3986 - https://www.ietf.org/rfc/rfc3986.txt
 *
 * eg.: In the url `https://github.com/dubzzz/fast-check/`, `dubzzz` and `fast-check` are segments
 */
export function webSegment() {
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
 * According to RFC 3986 - https://www.ietf.org/rfc/rfc3986.txt
 *
 * eg.: In the url `https://domain/plop/?hello=1&world=2`, `?hello=1&world=2` are query parameters
 */
export function webQueryParameters() {
  return uriQueryOrFragment();
}

/**
 * For fragments of an URI (web included)
 *
 * According to RFC 3986 - https://www.ietf.org/rfc/rfc3986.txt
 *
 * eg.: In the url `https://domain/plop?page=1#hello=1&world=2`, `?hello=1&world=2` are query parameters
 */
export function webFragments() {
  return uriQueryOrFragment();
}

export interface WebUrlConstraints {
  /** Enforce specific schemes, eg.: http, https */
  validSchemes?: string[];
  /** Settings for {@see webAuthority} */
  authoritySettings?: WebAuthorityConstraints;
  /** Enable query parameters in the generated url */
  withQueryParameters?: boolean;
  /** Enable fragments in the generated url */
  withFragments?: boolean;
}

/**
 * For web url
 *
 * According to RFC 3986 and WHATWG URL Standard
 * - https://www.ietf.org/rfc/rfc3986.txt
 * - https://url.spec.whatwg.org/
 *
 * @param constraints
 */
export function webUrl(constraints?: {
  validSchemes?: string[];
  authoritySettings?: WebAuthorityConstraints;
  withQueryParameters?: boolean;
  withFragments?: boolean;
}) {
  const c = constraints || {};
  const validSchemes = c.validSchemes || ['http', 'https'];
  const schemeArb = constantFrom(...validSchemes);
  const authorityArb = webAuthority(c.authoritySettings);
  const pathArb = array(webSegment()).map(p => p.map(v => `/${v}`).join(''));
  return tuple(
    schemeArb,
    authorityArb,
    pathArb,
    c.withQueryParameters === true ? option(webQueryParameters()) : constant(null),
    c.withFragments === true ? option(webFragments()) : constant(null)
  ).map(([s, a, p, q, f]) => `${s}://${a}${p}${q === null ? '' : `?${q}`}${f === null ? '' : `#${f}`}`);
}
