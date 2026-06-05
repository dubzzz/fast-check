import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { safeMap, safeSplit } from '../utils/globals.js';
import { nat } from './nat.js';
import { tuple } from './tuple.js';
import { tryParseStringifiedNat } from './_internals/mappers/NatToStringifiedNat.js';

/** @internal */
function dotJoinerMapper(data: number[]): string {
  // Fixed-shape, fused join over exactly 4 numbers. Avoids the poisoning-safe
  // `safeJoin` wrapper (identity-check + generic Array.prototype.join). For the
  // integers 0..255 produced by `nat(255)`, `+` with a string operand coerces
  // each number identically to the default number->string used by `join`, so
  // the output is byte-identical to `data.join('.')`.
  return data[0] + '.' + data[1] + '.' + data[2] + '.' + data[3];
}

/** @internal */
function dotJoinerUnmapper(value: unknown): number[] {
  if (typeof value !== 'string') {
    throw new Error('Invalid type');
  }
  return safeMap(safeSplit(value, '.'), (v) => tryParseStringifiedNat(v, 10));
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
