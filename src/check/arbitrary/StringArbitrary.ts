import { array, maxLengthFromMinLength } from './ArrayArbitrary';
import { ascii, base64, char, char16bits, fullUnicode, hexa, unicode } from './CharacterArbitrary';
import { Arbitrary } from './definition/Arbitrary';

/**
 * Constraints to be applied on arbitraries for strings
 * @remarks Since 2.4.0
 * @public
 */
export interface StringSharedConstraints {
  /**
   * Lower bound of the generated string length (included)
   * @remarks Since 2.4.0
   */
  minLength?: number;
  /**
   * Upper bound of the generated string length (included)
   * @remarks Since 2.4.0
   */
  maxLength?: number;
}

/** @internal */
function StringArbitrary(charArb: Arbitrary<string>, constraints: StringSharedConstraints) {
  return array(charArb, constraints).map((tab) => tab.join(''));
}

/** @internal */
function Base64StringArbitrary(unscaledMinLength: number, unscaledMaxLength: number) {
  // base64 length is always a multiple of 4
  const minLength = unscaledMinLength + 3 - ((unscaledMinLength + 3) % 4);
  const maxLength = unscaledMaxLength - (unscaledMaxLength % 4);

  if (minLength > maxLength) throw new Error('Minimal length should be inferior or equal to maximal length');
  if (minLength % 4 !== 0) throw new Error('Minimal length of base64 strings must be a multiple of 4');
  if (maxLength % 4 !== 0) throw new Error('Maximal length of base64 strings must be a multiple of 4');
  return StringArbitrary(base64(), { minLength, maxLength }).map((s) => {
    switch (s.length % 4) {
      case 0:
        return s;
      case 3:
        return `${s}=`;
      case 2:
        return `${s}==`;
      default:
        return s.slice(1); // remove one extra char to get to %4 == 0
    }
  });
}

/**
 * For strings using the characters produced by `charArb`
 *
 * @param charArb - Arbitrary able to generate random strings (possibly multiple characters)
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 1.1.3
 * @public
 */
function stringOf(charArb: Arbitrary<string>, constraints: StringSharedConstraints = {}): Arbitrary<string> {
  return StringArbitrary(charArb, constraints);
}

/**
 * For strings of {@link char}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.1
 * @public
 */
function string(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  return StringArbitrary(char(), constraints);
}

/**
 * For strings of {@link ascii}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.1
 * @public
 */
function asciiString(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  return StringArbitrary(ascii(), constraints);
}

/**
 * For strings of {@link char16bits}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.11
 * @public
 */
function string16bits(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  return StringArbitrary(char16bits(), constraints);
}

/**
 * For strings of {@link unicode}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.11
 * @public
 */
function unicodeString(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  return StringArbitrary(unicode(), constraints);
}

/**
 * For strings of {@link fullUnicode}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.11
 * @public
 */
function fullUnicodeString(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  return StringArbitrary(fullUnicode(), constraints);
}

/**
 * For strings of {@link hexa}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.1
 * @public
 */
function hexaString(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  return StringArbitrary(hexa(), constraints);
}

/**
 * For base64 strings
 *
 * A base64 string will always have a length multiple of 4 (padded with =)
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.1
 * @public
 */
function base64String(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  const { minLength = 0, maxLength = maxLengthFromMinLength(minLength) } = constraints;
  return Base64StringArbitrary(minLength, maxLength);
}

export { stringOf, string, asciiString, string16bits, unicodeString, fullUnicodeString, hexaString, base64String };
