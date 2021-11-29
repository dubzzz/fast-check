import { array } from './array';
import { buildLowerAlphaNumericArbitrary } from './_internals/builders/CharacterRangeArbitraryBuilder';
import { domain } from './domain';
import { stringOf } from './stringOf';
import { tuple } from './tuple';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';

/** @internal */
function dotMapper(a: string[]): string {
  return a.join('.');
}
/** @internal */
function dotUnmapper(value: unknown): string[] {
  if (typeof value !== 'string') {
    throw new Error('Unsupported');
  }
  return value.split('.');
}
/** @internal */
function atMapper(data: [string, string]): string {
  return `${data[0]}@${data[1]}`;
}
/** @internal */
function atUnmapper(value: unknown): [string, string] {
  if (typeof value !== 'string') {
    throw new Error('Unsupported');
  }
  return value.split('@', 2) as [string, string];
}

/**
 * For email address
 *
 * According to {@link https://www.ietf.org/rfc/rfc2821.txt | RFC 2821},
 * {@link https://www.ietf.org/rfc/rfc3696.txt | RFC 3696} and
 * {@link https://www.ietf.org/rfc/rfc5322.txt | RFC 5322}
 *
 * @remarks Since 1.14.0
 * @public
 */
export function emailAddress(): Arbitrary<string> {
  const others = ['!', '#', '$', '%', '&', "'", '*', '+', '-', '/', '=', '?', '^', '_', '`', '{', '|', '}', '~'];
  const atextArb = buildLowerAlphaNumericArbitrary(others);
  const localPartArb = array(stringOf(atextArb, { minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 })
    .map(dotMapper, dotUnmapper)
    // According to RFC 2821:
    //    The maximum total length of a user name or other local-part is 64 characters.
    .filter((lp) => lp.length <= 64);

  return tuple(localPartArb, domain()).map(atMapper, atUnmapper);
}
