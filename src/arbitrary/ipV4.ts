import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { nat } from './nat';
import { tuple } from './tuple';

/**
 * For valid IP v4
 *
 * Following {@link https://tools.ietf.org/html/rfc3986#section-3.2.2 | RFC 3986}
 *
 * @remarks Since 1.14.0
 * @public
 */
export function ipV4(): Arbitrary<string> {
  // IPv4address = dec-octet "." dec-octet "." dec-octet "." dec-octet
  return tuple(nat(255), nat(255), nat(255), nat(255)).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);
}
