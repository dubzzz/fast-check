import { array } from './array';
import {
  buildLowerAlphaArbitrary,
  buildLowerAlphaNumericArbitrary,
} from './_internals/builders/CharacterRangeArbitraryBuilder';
import { option } from './option';
import { stringOf } from './stringOf';
import { tuple } from './tuple';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { filterInvalidSubdomainLabel } from './_internals/helpers/InvalidSubdomainLabelFiIter';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { resolveSize, relativeSizeToSize, Size, SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength';
import { adapter, AdapterOutput } from './_internals/AdapterArbitrary';

/** @internal */
function toSubdomainLabelMapper([f, d]: [string, [string, string] | null]): string {
  return d === null ? f : `${f}${d[0]}${d[1]}`;
}
/** @internal */
function toSubdomainLabelUnmapper(value: unknown): [string, [string, string] | null] {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('Unsupported');
  }
  if (value.length === 1) {
    return [value[0], null];
  }
  return [value[0], [value.substring(1, value.length - 1), value[value.length - 1]]];
}

/** @internal */
function subdomainLabel(size: Size) {
  const alphaNumericArb = buildLowerAlphaNumericArbitrary([]);
  const alphaNumericHyphenArb = buildLowerAlphaNumericArbitrary(['-']);
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
  return convertFromNext(
    convertToNext(
      tuple(alphaNumericArb, option(tuple(stringOf(alphaNumericHyphenArb, { size, maxLength: 61 }), alphaNumericArb)))
    )
      .map(toSubdomainLabelMapper, toSubdomainLabelUnmapper)
      .filter(filterInvalidSubdomainLabel)
  );
}

/** @internal */
function labelsMapper(elements: [string[], string]): string {
  return `${elements[0].join('.')}.${elements[1]}`;
}
/** @internal */
function labelsUnmapper(value: unknown): [string[], string] {
  if (typeof value !== 'string') {
    throw new Error('Unsupported type');
  }
  const lastDotIndex = value.lastIndexOf('.');
  return [value.substring(0, lastDotIndex).split('.'), value.substring(lastDotIndex + 1)];
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
      return { adapted: true, value: [subDomains.slice(0, index), suffix] };
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
  const alphaNumericArb = buildLowerAlphaArbitrary([]);
  const publicSuffixArb = stringOf(alphaNumericArb, { minLength: 2, maxLength: 63, size: resolvedSizeMinusOne });
  return convertFromNext(
    // labels have between 1 and 63 characters
    // domains are made of dot-separated labels and have up to 255 characters so that are made of up-to 128 labels
    adapter(
      convertToNext(
        tuple(
          array(subdomainLabel(resolvedSize), { size: resolvedSizeMinusOne, minLength: 1, maxLength: 127 }),
          publicSuffixArb
        )
      ),
      labelsAdapter
    ).map(labelsMapper, labelsUnmapper)
  );
}
