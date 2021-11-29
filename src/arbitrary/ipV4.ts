import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { nat } from './nat';
import { tuple } from './tuple';
import { tryParseStringifiedNat } from './_internals/mappers/NatToStringifiedNat';

/** @internal */
function dotJoinerMapper(data: number[]): string {
  return data.join('.');
}

/** @internal */
function dotJoinerUnmapper(value: unknown): number[] {
  if (typeof value !== 'string') {
    throw new Error('Invalid type');
  }
  return value.split('.').map((v) => tryParseStringifiedNat(v, 10));
}

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
  return tuple<number[]>(nat(255), nat(255), nat(255), nat(255)).map(dotJoinerMapper, dotJoinerUnmapper);
}
