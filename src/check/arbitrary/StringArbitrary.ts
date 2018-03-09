import * as assert from 'power-assert'
import Arbitrary from './definition/Arbitrary'
import Shrinkable from './definition/Shrinkable'
import { array } from './ArrayArbitrary'
import { nat } from './IntegerArbitrary'
import { char, ascii, char16bits, unicode, fullUnicode, hexa, base64 } from './CharacterArbitrary'
import Random from '../../random/generator/Random'

function StringArbitrary(charArb: Arbitrary<string>, aLength?: number, bLength?: number) {
    const arrayArb = aLength != null
            ? (bLength != null
                ? array(charArb, aLength, bLength)
                : array(charArb, aLength))
            : array(charArb);
    return arrayArb.map(tab => tab.join(''));
}

function Base64StringArbitrary(minLength: number, maxLength: number) {
    assert.ok(minLength <= maxLength, 'Minimal length should be inferior or equal to maximal length');
    assert.equal(minLength % 4, 0, 'Minimal length of base64 strings must be a multiple of 4');
    assert.equal(maxLength % 4, 0, 'Maximal length of base64 strings must be a multiple of 4');
    return StringArbitrary(base64(), minLength, maxLength).map(s => {
        switch (s.length % 4) {
            case 0: return s;
            case 3: return `${s}=`;
            case 2: return `${s}==`;
        }
        return s.slice(1); //remove one extra char to get to %4 == 0
    });
}

function string(): Arbitrary<string>;
function string(maxLength: number): Arbitrary<string>;
function string(minLength: number, maxLength: number): Arbitrary<string>;
function string(aLength?: number, bLength?: number): Arbitrary<string> {
    return StringArbitrary(char(), aLength, bLength);
}

function asciiString(): Arbitrary<string>;
function asciiString(maxLength: number): Arbitrary<string>;
function asciiString(minLength: number, maxLength: number): Arbitrary<string>;
function asciiString(aLength?: number, bLength?: number): Arbitrary<string> {
    return StringArbitrary(ascii(), aLength, bLength);
}

function string16bits(): Arbitrary<string>;
function string16bits(maxLength: number): Arbitrary<string>;
function string16bits(minLength: number, maxLength: number): Arbitrary<string>;
function string16bits(aLength?: number, bLength?: number): Arbitrary<string> {
    return StringArbitrary(char16bits(), aLength, bLength);
}

function unicodeString(): Arbitrary<string>;
function unicodeString(maxLength: number): Arbitrary<string>;
function unicodeString(minLength: number, maxLength: number): Arbitrary<string>;
function unicodeString(aLength?: number, bLength?: number): Arbitrary<string> {
    return StringArbitrary(unicode(), aLength, bLength);
}

function fullUnicodeString(): Arbitrary<string>;
function fullUnicodeString(maxLength: number): Arbitrary<string>;
function fullUnicodeString(minLength: number, maxLength: number): Arbitrary<string>;
function fullUnicodeString(aLength?: number, bLength?: number): Arbitrary<string> {
    return StringArbitrary(fullUnicode(), aLength, bLength);
}

function hexaString(): Arbitrary<string>;
function hexaString(maxLength: number): Arbitrary<string>;
function hexaString(minLength: number, maxLength: number): Arbitrary<string>;
function hexaString(aLength?: number, bLength?: number): Arbitrary<string> {
    return StringArbitrary(hexa(), aLength, bLength);
}

function base64String(): Arbitrary<string>;
function base64String(maxLength: number): Arbitrary<string>;
function base64String(minLength: number, maxLength: number): Arbitrary<string>;
function base64String(aLength?: number, bLength?: number): Arbitrary<string> {
    const minLength = aLength != null && bLength != null ? aLength : 0;
    const maxLength = bLength == null ? (aLength == null ? 16 : aLength) : bLength;
    return Base64StringArbitrary(
        (minLength +3) - (minLength +3)%4,
        maxLength - maxLength%4); // base64 length is always a multiple of 4
}

export { string, asciiString, string16bits, unicodeString, fullUnicodeString, hexaString, base64String };
