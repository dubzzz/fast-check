import { array } from '../../arbitrary/array';
import { maxLengthFromMinLength } from '../../arbitrary/_internals/helpers/MaxLengthFromMinLength';
import { ascii, base64, char, char16bits, fullUnicode, hexa, unicode } from '../../arbitrary/CharacterArbitrary';
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
type StringFullConstraintsDefinition = [] | [number] | [number, number] | [StringSharedConstraints];

/** @internal */
function StringArbitrary(charArb: Arbitrary<string>, ...args: StringFullConstraintsDefinition) {
  const arrayArb =
    args[0] !== undefined
      ? typeof args[0] === 'number'
        ? typeof args[1] === 'number'
          ? array(charArb, { minLength: args[0], maxLength: args[1] })
          : array(charArb, { maxLength: args[0] })
        : array(charArb, args[0])
      : array(charArb);
  return arrayArb.map((tab) => tab.join(''));
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
 *
 * @remarks Since 1.1.3
 * @public
 */
function stringOf(charArb: Arbitrary<string>): Arbitrary<string>;
/**
 * For strings using the characters produced by `charArb`
 *
 * @param charArb - Arbitrary able to generate random strings (possibly multiple characters)
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.stringOf(charArb, {maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 1.1.3
 * @public
 */
function stringOf(charArb: Arbitrary<string>, maxLength: number): Arbitrary<string>;
/**
 * For strings using the characters produced by `charArb`
 *
 * @param charArb - Arbitrary able to generate random strings (possibly multiple characters)
 * @param minLength - Lower bound of the generated string length
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.stringOf(charArb, {minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 1.1.3
 * @public
 */
function stringOf(charArb: Arbitrary<string>, minLength: number, maxLength: number): Arbitrary<string>;
/**
 * For strings using the characters produced by `charArb`
 *
 * @param charArb - Arbitrary able to generate random strings (possibly multiple characters)
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function stringOf(charArb: Arbitrary<string>, constraints: StringSharedConstraints): Arbitrary<string>;
function stringOf(charArb: Arbitrary<string>, ...args: StringFullConstraintsDefinition): Arbitrary<string> {
  return StringArbitrary(charArb, ...args);
}

/**
 * For strings of {@link char}
 * @remarks Since 0.0.1
 * @public
 */
function string(): Arbitrary<string>;
/**
 * For strings of {@link char}
 *
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.string({maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.1
 * @public
 */
function string(maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link char}
 *
 * @param minLength - Lower bound of the generated string length
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.string({minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function string(minLength: number, maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link char}
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function string(constraints: StringSharedConstraints): Arbitrary<string>;
function string(...args: StringFullConstraintsDefinition): Arbitrary<string> {
  return StringArbitrary(char(), ...args);
}

/**
 * For strings of {@link ascii}
 * @remarks Since 0.0.1
 * @public
 */
function asciiString(): Arbitrary<string>;
/**
 * For strings of {@link ascii}
 *
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.asciiString({maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.1
 * @public
 */
function asciiString(maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link ascii}
 *
 * @param minLength - Lower bound of the generated string length
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.asciiString({minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function asciiString(minLength: number, maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link ascii}
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function asciiString(constraints: StringSharedConstraints): Arbitrary<string>;
function asciiString(...args: StringFullConstraintsDefinition): Arbitrary<string> {
  return StringArbitrary(ascii(), ...args);
}

/**
 * For strings of {@link char16bits}
 * @remarks Since 0.0.11
 * @public
 */
function string16bits(): Arbitrary<string>;
/**
 * For strings of {@link char16bits}
 *
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.string16bits({maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function string16bits(maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link char16bits}
 *
 * @param minLength - Lower bound of the generated string length
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.string16bits({minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function string16bits(minLength: number, maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link char16bits}
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function string16bits(constraints: StringSharedConstraints): Arbitrary<string>;
function string16bits(...args: StringFullConstraintsDefinition): Arbitrary<string> {
  return StringArbitrary(char16bits(), ...args);
}

/**
 * For strings of {@link unicode}
 * @remarks Since 0.0.11
 * @public
 */
function unicodeString(): Arbitrary<string>;
/**
 * For strings of {@link unicode}
 *
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.unicodeString({maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function unicodeString(maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link unicode}
 *
 * @param minLength - Lower bound of the generated string length
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.unicodeString({minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function unicodeString(minLength: number, maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link unicode}
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function unicodeString(constraints: StringSharedConstraints): Arbitrary<string>;
function unicodeString(...args: StringFullConstraintsDefinition): Arbitrary<string> {
  return StringArbitrary(unicode(), ...args);
}

/**
 * For strings of {@link fullUnicode}
 * @remarks Since 0.0.11
 * @public
 */
function fullUnicodeString(): Arbitrary<string>;
/**
 * For strings of {@link fullUnicode}
 *
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.fullUnicodeString({maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function fullUnicodeString(maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link fullUnicode}
 *
 * @param minLength - Lower bound of the generated string length
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.fullUnicodeString({minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function fullUnicodeString(minLength: number, maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link fullUnicode}
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function fullUnicodeString(constraints: StringSharedConstraints): Arbitrary<string>;
function fullUnicodeString(...args: StringFullConstraintsDefinition): Arbitrary<string> {
  return StringArbitrary(fullUnicode(), ...args);
}

/**
 * For strings of {@link hexa}
 * @remarks Since 0.0.1
 * @public
 */
function hexaString(): Arbitrary<string>;
/**
 * For strings of {@link hexa}
 *
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.hexaString({maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.1
 * @public
 */
function hexaString(maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link hexa}
 *
 * @param minLength - Lower bound of the generated string length
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.hexaString({minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function hexaString(minLength: number, maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link hexa}
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function hexaString(constraints: StringSharedConstraints): Arbitrary<string>;
function hexaString(...args: StringFullConstraintsDefinition): Arbitrary<string> {
  return StringArbitrary(hexa(), ...args);
}

/**
 * For base64 strings
 *
 * A base64 string will always have a length multiple of 4 (padded with =)
 *
 * @remarks Since 0.0.1
 * @public
 */
function base64String(): Arbitrary<string>;
/**
 * For base64 strings
 *
 * A base64 string will always have a length multiple of 4 (padded with =)
 *
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.base64String({maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.1
 * @public
 */
function base64String(maxLength: number): Arbitrary<string>;
/**
 * For base64 strings
 *
 * A base64 string will always have a length multiple of 4 (padded with =)
 *
 * @param minLength - Lower bound of the generated string length
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.base64String({minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function base64String(minLength: number, maxLength: number): Arbitrary<string>;
/**
 * For base64 strings
 *
 * A base64 string will always have a length multiple of 4 (padded with =)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function base64String(constraints: StringSharedConstraints): Arbitrary<string>;
function base64String(...args: StringFullConstraintsDefinition): Arbitrary<string> {
  if (args[0] !== undefined) {
    if (typeof args[0] === 'number') {
      if (typeof args[1] === 'number') {
        // base64String(arb, minLength, maxLength)
        return Base64StringArbitrary(args[0], args[1]);
      } else {
        // base64String(arb, maxLength)
        return Base64StringArbitrary(0, args[0]);
      }
    } else {
      // base64String(arb, constraints)
      const minLength = args[0].minLength !== undefined ? args[0].minLength : 0;
      const maxLength = args[0].maxLength !== undefined ? args[0].maxLength : maxLengthFromMinLength(minLength);
      return Base64StringArbitrary(minLength, maxLength);
    }
  }
  // base64String(arb)
  return Base64StringArbitrary(0, maxLengthFromMinLength(0));
}

export { stringOf, string, asciiString, string16bits, unicodeString, fullUnicodeString, hexaString, base64String };
