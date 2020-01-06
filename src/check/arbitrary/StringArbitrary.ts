import { array } from './ArrayArbitrary';
import { ascii, base64, char, char16bits, fullUnicode, hexa, unicode } from './CharacterArbitrary';
import { Arbitrary } from './definition/Arbitrary';

/** @internal */
function StringArbitrary(charArb: Arbitrary<string>, aLength?: number, bLength?: number) {
  const arrayArb =
    aLength != null ? (bLength != null ? array(charArb, aLength, bLength) : array(charArb, aLength)) : array(charArb);
  return arrayArb.map(tab => tab.join(''));
}

/** @internal */
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
 * For strings using the characters produced by `charArb`
 */
function stringOf(charArb: Arbitrary<string>): Arbitrary<string>;
/**
 * For strings using the characters produced by `charArb`
 * @param maxLength Upper bound of the generated string length
 */
function stringOf(charArb: Arbitrary<string>, maxLength: number): Arbitrary<string>;
/**
 * For strings using the characters produced by `charArb`
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function stringOf(charArb: Arbitrary<string>, minLength: number, maxLength: number): Arbitrary<string>;
function stringOf(charArb: Arbitrary<string>, aLength?: number, bLength?: number): Arbitrary<string> {
  return StringArbitrary(charArb, aLength, bLength);
}

/**
 * For strings of {@link char}
 */
function string(): Arbitrary<string>;
/**
 * For strings of {@link char}
 * @param maxLength Upper bound of the generated string length
 */
function string(maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link char}
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function string(minLength: number, maxLength: number): Arbitrary<string>;
function string(aLength?: number, bLength?: number): Arbitrary<string> {
  return StringArbitrary(char(), aLength, bLength);
}

/**
 * For strings of {@link ascii}
 */
function asciiString(): Arbitrary<string>;
/**
 * For strings of {@link ascii}
 * @param maxLength Upper bound of the generated string length
 */
function asciiString(maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link ascii}
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function asciiString(minLength: number, maxLength: number): Arbitrary<string>;
function asciiString(aLength?: number, bLength?: number): Arbitrary<string> {
  return StringArbitrary(ascii(), aLength, bLength);
}

/**
 * For strings of {@link string16bits}
 */
function string16bits(): Arbitrary<string>;
/**
 * For strings of {@link string16bits}
 * @param maxLength Upper bound of the generated string length
 */
function string16bits(maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link string16bits}
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function string16bits(minLength: number, maxLength: number): Arbitrary<string>;
function string16bits(aLength?: number, bLength?: number): Arbitrary<string> {
  return StringArbitrary(char16bits(), aLength, bLength);
}

/**
 * For strings of {@link unicode}
 */
function unicodeString(): Arbitrary<string>;
/**
 * For strings of {@link unicode}
 * @param maxLength Upper bound of the generated string length
 */
function unicodeString(maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link unicode}
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function unicodeString(minLength: number, maxLength: number): Arbitrary<string>;
function unicodeString(aLength?: number, bLength?: number): Arbitrary<string> {
  return StringArbitrary(unicode(), aLength, bLength);
}

/**
 * For strings of {@link fullUnicode}
 */
function fullUnicodeString(): Arbitrary<string>;
/**
 * For strings of {@link fullUnicode}
 * @param maxLength Upper bound of the generated string length
 */
function fullUnicodeString(maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link fullUnicode}
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function fullUnicodeString(minLength: number, maxLength: number): Arbitrary<string>;
function fullUnicodeString(aLength?: number, bLength?: number): Arbitrary<string> {
  return StringArbitrary(fullUnicode(), aLength, bLength);
}

/**
 * For strings of {@link hexa}
 */
function hexaString(): Arbitrary<string>;
/**
 * For strings of {@link hexa}
 * @param maxLength Upper bound of the generated string length
 */
function hexaString(maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link hexa}
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function hexaString(minLength: number, maxLength: number): Arbitrary<string>;
function hexaString(aLength?: number, bLength?: number): Arbitrary<string> {
  return StringArbitrary(hexa(), aLength, bLength);
}

/**
 * For base64 strings
 *
 * A base64 string will always have a length multiple of 4 (padded with =)
 */
function base64String(): Arbitrary<string>;
/**
 * For base64 strings
 *
 * A base64 string will always have a length multiple of 4 (padded with =)
 *
 * @param maxLength Upper bound of the generated string length
 */
function base64String(maxLength: number): Arbitrary<string>;
/**
 * For base64 strings
 *
 * A base64 string will always have a length multiple of 4 (padded with =)
 *
 * @param minLength Lower bound of the generated string length
 * @param maxLength Upper bound of the generated string length
 */
function base64String(minLength: number, maxLength: number): Arbitrary<string>;
function base64String(aLength?: number, bLength?: number): Arbitrary<string> {
  const minLength = aLength != null && bLength != null ? aLength : 0;
  const maxLength = bLength == null ? (aLength == null ? 16 : aLength) : bLength;
  return Base64StringArbitrary(minLength + 3 - ((minLength + 3) % 4), maxLength - (maxLength % 4)); // base64 length is always a multiple of 4
}

export { stringOf, string, asciiString, string16bits, unicodeString, fullUnicodeString, hexaString, base64String };
