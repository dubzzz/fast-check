import { array } from './array.js';
import {
  getOrCreateLowerAlphaArbitrary,
  getOrCreateLowerAlphaNumericArbitrary,
} from './_internals/builders/CharacterRangeArbitraryBuilder.js';
import { option } from './option.js';
import { string } from './string.js';
import { tuple } from './tuple.js';
import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { filterInvalidSubdomainLabel } from './_internals/helpers/InvalidSubdomainLabelFiIter.js';
import type { Size, SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength.js';
import { resolveSize, relativeSizeToSize } from './_internals/helpers/MaxLengthFromMinLength.js';
import type { AdapterOutput } from './_internals/AdapterArbitrary.js';
import { adapter } from './_internals/AdapterArbitrary.js';
import { safeJoin, safeSlice, safeSplit, safeSubstring } from '../utils/globals.js';

/** @internal */
function toSubdomainLabelMapper([f, d]: [string, [string, string] | null]): string {
  return d === null ? f : `${f}${d[0]}${d[1]}`;
}
/** @internal */
function toSubdomainLabelUnmapper(value: unknown): [string, [string, string] | null] {
  const v = value as string;
  if (v.length === 0) {
    throw new Error('Unsupported');
  }
  if (v.length === 1) {
    return [v[0], null];
  }
  return [v[0], [safeSubstring(v, 1, v.length - 1), v[v.length - 1]]];
}

/** @internal */
function subdomainLabel(size: Size) {
  const alphaNumericArb = getOrCreateLowerAlphaNumericArbitrary('');
  const alphaNumericHyphenArb = getOrCreateLowerAlphaNumericArbitrary('-');
  // Rq: maxLength = 61 because max length of a label is 63 according to RFC 1034
  //     and we add 2 characters to this generated value
  // According to RFC 1034 (confirmed by RFC 1035):
  //   <label>       ::= <letter> [ [ <ldh-str> ] <let-dig> ]
  //   <ldh-str>     ::= <let-dig-hyp> | <let-dig-hyp> <ldh-str>
  //   <let-dig-hyp> ::= <let-dig> | "-"
  //   <letter>      ::= any one of the 52 alphabetic characters A through Z in upper case and a through z in lower case
  //   <digit>       ::= any one of the ten digits 0 through 9
  //   "The labels must follow the rules for ARPANET host names.  They must start with a letter, end with a letter or digit, and have as interior
  //    characters only letters, digits, and hyphen.  There are also some restrictions on the length.  Labels must be 63 characters or less."
  // But RFC 1123 relaxed the constraint:
  //   "The syntax of a legal Internet host name was specified in RFC-952[DNS:4]. One aspect of host name syntax is hereby changed: the
  //    restriction on the first character is relaxed to allow either a letter or a digit. Host software MUST support this more liberal syntax."
  return tuple(
    alphaNumericArb,
    option(tuple(string({ unit: alphaNumericHyphenArb, size, maxLength: 61 }), alphaNumericArb)),
  )
    .map(toSubdomainLabelMapper, toSubdomainLabelUnmapper)
    .filter(filterInvalidSubdomainLabel);
}

/** @internal */
function labelsMapper(elements: [string[], string]): string {
  return `${safeJoin(elements[0], '.')}.${elements[1]}`;
}
/** @internal */
function labelsUnmapper(value: unknown): [string[], string] {
  const v = value as string;
  const lastDotIndex = v.lastIndexOf('.');
  return [safeSplit(safeSubstring(v, 0, lastDotIndex), '.'), safeSubstring(v, lastDotIndex + 1)];
}

/** @internal */
function labelsAdapter(labels: [string[], string]): AdapterOutput<[string[], string]> {
  // labels[0].length is always >=1
  const [subDomains, suffix] = labels;
  let lengthNotIncludingIndex = suffix.length;
  for (let index = 0; index !== subDomains.length; ++index) {
    lengthNotIncludingIndex += 1 + subDomains[index].length;
    // Required by RFC 1034:
    //    To simplify implementations, the total number of octets that represent
    //    a domain name (i.e., the sum of all label octets and label lengths) is limited to 255.
    // It seems that this restriction has been relaxed in modern web browsers.
    if (lengthNotIncludingIndex > 255) {
      return { adapted: true, value: [safeSlice(subDomains, 0, index), suffix] };
    }
  }
  return { adapted: false, value: labels };
}

/**
 * Constraints to be applied on {@link domain}
 * @remarks Since 2.22.0
 * @public
 */
export interface DomainConstraints {
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 2.22.0
   */
  size?: Exclude<SizeForArbitrary, 'max'>;
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
 * @param constraints - Constraints to apply when building instances (since 2.22.0)
 *
 * @remarks Since 1.14.0
 * @public
 */
export function domain(constraints: DomainConstraints = {}): Arbitrary<string> {
  const resolvedSize = resolveSize(constraints.size);
  const resolvedSizeMinusOne = relativeSizeToSize('-1', resolvedSize);
  // A list of public suffixes can be found here: https://publicsuffix.org/list/public_suffix_list.dat
  // our current implementation does not follow this list and generate a fully randomized suffix
  // which is probably not in this list (probability would be low)
  const lowerAlphaArb = getOrCreateLowerAlphaArbitrary();
  const publicSuffixArb = string({ unit: lowerAlphaArb, minLength: 2, maxLength: 63, size: resolvedSizeMinusOne });
  return (
    // labels have between 1 and 63 characters
    // domains are made of dot-separated labels and have up to 255 characters so that are made of up-to 128 labels
    adapter(
      tuple(
        array(subdomainLabel(resolvedSize), { size: resolvedSizeMinusOne, minLength: 1, maxLength: 127 }),
        publicSuffixArb,
      ),
      labelsAdapter,
    ).map(labelsMapper, labelsUnmapper)
  );
}
