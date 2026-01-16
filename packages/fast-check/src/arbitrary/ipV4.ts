import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { safeJoin, safeMap, safeSplit } from '../utils/globals.js';
import { nat } from './nat.js';
import { tuple } from './tuple.js';
import { tryParseStringifiedNat } from './_internals/mappers/NatToStringifiedNat.js';

/** @internal */
function dotJoinerMapper(data: number[]): string {
  return safeJoin(data, '.');
}

/** @internal */
function dotJoinerUnmapper(value: unknown): number[] {
  return safeMap(safeSplit(value as string, '.'), (v) => tryParseStringifiedNat(v, 10));
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
