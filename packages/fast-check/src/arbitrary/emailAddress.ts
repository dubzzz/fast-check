import { array } from './array';
import { getOrCreateLowerAlphaNumericArbitrary } from './_internals/builders/CharacterRangeArbitraryBuilder';
import { domain } from './domain';
import { string } from './string';
import { tuple } from './tuple';
import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import type { SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength';
import type { AdapterOutput } from './_internals/AdapterArbitrary';
import { adapter } from './_internals/AdapterArbitrary';
import { safeJoin, safeSlice, safeSplit } from '../utils/globals';

/** @internal */
function dotAdapter(a: string[]): AdapterOutput<string[]> {
  // According to RFC 2821:
  //    The maximum total length of a user name or other local-part is 64 characters.
  let currentLength = a[0].length; // always at least one element
  for (let index = 1; index !== a.length; ++index) {
    currentLength += 1 + a[index].length;
    if (currentLength > 64) {
      return { adapted: true, value: safeSlice(a, 0, index) };
    }
  }
  return { adapted: false, value: a };
}
/** @internal */
function dotMapper(a: string[]): string {
  return safeJoin(a, '.');
}
/** @internal */
function dotUnmapper(value: unknown): string[] {
  if (typeof value !== 'string') {
    throw new Error('Unsupported');
  }
  return safeSplit(value, '.');
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
  return safeSplit(value, '@', 2) as [string, string];
}

/**
 * Constraints to be applied on {@link emailAddress}
 * @remarks Since 2.22.0
 * @public
 */
export interface EmailAddressConstraints {
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 2.22.0
   */
  size?: Exclude<SizeForArbitrary, 'max'>;
}

/**
 * For email address
 *
 * According to {@link https://www.ietf.org/rfc/rfc2821.txt | RFC 2821},
 * {@link https://www.ietf.org/rfc/rfc3696.txt | RFC 3696} and
 * {@link https://www.ietf.org/rfc/rfc5322.txt | RFC 5322}
 *
 * @param constraints - Constraints to apply when building instances (since 2.22.0)
 *
 * @remarks Since 1.14.0
 * @public
 */
export function emailAddress(constraints: EmailAddressConstraints = {}): Arbitrary<string> {
  const atextArb = getOrCreateLowerAlphaNumericArbitrary("!#$%&'*+-/=?^_`{|}~");
  const localPartArb = adapter(
    // Maximal length for the output of dotMapper is 64,
    // In other words:
    // - `string({unit:atextArb,...})` cannot produce values having more than 64 characters
    // - `array(...)` cannot produce more than 32 values
    array(
      string({
        unit: atextArb,
        minLength: 1,
        maxLength: 64,
        size: constraints.size,
      }),
      { minLength: 1, maxLength: 32, size: constraints.size },
    ),
    dotAdapter,
  ).map(dotMapper, dotUnmapper);

  return tuple(localPartArb, domain({ size: constraints.size })).map(atMapper, atUnmapper);
}
