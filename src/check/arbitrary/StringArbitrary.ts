import Random from '../../random/generator/Random';
import { array } from './ArrayArbitrary';
import { ascii, base64, char, char16bits, fullUnicode, hexa, unicode } from './CharacterArbitrary';
import Arbitrary from './definition/Arbitrary';
import Shrinkable from './definition/Shrinkable';
import { nat } from './IntegerArbitrary';

function StringArbitrary(charArb: Arbitrary<string>, aLength?: number, bLength?: number) {
  const arrayArb =
    aLength != null ? (bLength != null ? array(charArb, aLength, bLength) : array(charArb, aLength)) : array(charArb);
  return arrayArb.map(tab => tab.join(''));
}

function Base64StringArbitrary(minLength: number, maxLength: number) {
  if (minLength > maxLength) throw new Error('Minimal length should be inferior or equal to maximal length');
  if (minLength % 4 !== 0) throw new Error('Minimal length of base64 strings must be a multiple of 4');
  if (maxLength % 4 !== 0) throw new Error('Maximal length of base64 strings must be a multiple of 4');
  return StringArbitrary(base64(), minLength, maxLength).map(s => {
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
 * Arbitrary producing string of {@link char}
 */
function string(): Arbitrary<string>;
/**
 * Arbitrary producing string of {@link char}
 * @param maxLength Upper bound of the generated string length
 */
function string(maxLength: number): Arbitrary<string>;
/**
 * Arbitrary producing string of {@link char}
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function string(minLength: number, maxLength: number): Arbitrary<string>;
function string(aLength?: number, bLength?: number): Arbitrary<string> {
  return StringArbitrary(char(), aLength, bLength);
}

/**
 * Arbitrary producing string of {@link ascii}
 */
function asciiString(): Arbitrary<string>;
/**
 * Arbitrary producing string of {@link ascii}
 * @param maxLength Upper bound of the generated string length
 */
function asciiString(maxLength: number): Arbitrary<string>;
/**
 * Arbitrary producing string of {@link ascii}
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function asciiString(minLength: number, maxLength: number): Arbitrary<string>;
function asciiString(aLength?: number, bLength?: number): Arbitrary<string> {
  return StringArbitrary(ascii(), aLength, bLength);
}

/**
 * Arbitrary producing string of {@link string16bits}
 */
function string16bits(): Arbitrary<string>;
/**
 * Arbitrary producing string of {@link string16bits}
 * @param maxLength Upper bound of the generated string length
 */
function string16bits(maxLength: number): Arbitrary<string>;
/**
 * Arbitrary producing string of {@link string16bits}
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function string16bits(minLength: number, maxLength: number): Arbitrary<string>;
function string16bits(aLength?: number, bLength?: number): Arbitrary<string> {
  return StringArbitrary(char16bits(), aLength, bLength);
}

/**
 * Arbitrary producing string of {@link unicode}
 */
function unicodeString(): Arbitrary<string>;
/**
 * Arbitrary producing string of {@link unicode}
 * @param maxLength Upper bound of the generated string length
 */
function unicodeString(maxLength: number): Arbitrary<string>;
/**
 * Arbitrary producing string of {@link unicode}
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function unicodeString(minLength: number, maxLength: number): Arbitrary<string>;
function unicodeString(aLength?: number, bLength?: number): Arbitrary<string> {
  return StringArbitrary(unicode(), aLength, bLength);
}

/**
 * Arbitrary producing string of {@link fullUnicode}
 */
function fullUnicodeString(): Arbitrary<string>;
/**
 * Arbitrary producing string of {@link fullUnicode}
 * @param maxLength Upper bound of the generated string length
 */
function fullUnicodeString(maxLength: number): Arbitrary<string>;
/**
 * Arbitrary producing string of {@link fullUnicode}
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function fullUnicodeString(minLength: number, maxLength: number): Arbitrary<string>;
function fullUnicodeString(aLength?: number, bLength?: number): Arbitrary<string> {
  return StringArbitrary(fullUnicode(), aLength, bLength);
}

/**
 * Arbitrary producing string of {@link hexa}
 */
function hexaString(): Arbitrary<string>;
/**
 * Arbitrary producing string of {@link hexa}
 * @param maxLength Upper bound of the generated string length
 */
function hexaString(maxLength: number): Arbitrary<string>;
/**
 * Arbitrary producing string of {@link hexa}
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function hexaString(minLength: number, maxLength: number): Arbitrary<string>;
function hexaString(aLength?: number, bLength?: number): Arbitrary<string> {
  return StringArbitrary(hexa(), aLength, bLength);
}

/**
 * Arbitrary producing base 64 string.
 * A base 64 string will always have a length multiple of 4 (padded with =)
 */
function base64String(): Arbitrary<string>;
/**
 * Arbitrary producing base 64 string.
 * A base 64 string will always have a length multiple of 4 (padded with =)
 *
 * @param maxLength Upper bound of the generated string length
 */
function base64String(maxLength: number): Arbitrary<string>;
/**
 * Arbitrary producing base 64 string.
 * A base 64 string will always have a length multiple of 4 (padded with =)
 *
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function base64String(minLength: number, maxLength: number): Arbitrary<string>;
function base64String(aLength?: number, bLength?: number): Arbitrary<string> {
  const minLength = aLength != null && bLength != null ? aLength : 0;
  const maxLength = bLength == null ? (aLength == null ? 16 : aLength) : bLength;
  return Base64StringArbitrary(minLength + 3 - (minLength + 3) % 4, maxLength - maxLength % 4); // base64 length is always a multiple of 4
}

export { string, asciiString, string16bits, unicodeString, fullUnicodeString, hexaString, base64String };
