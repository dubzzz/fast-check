import * as assert from 'power-assert'
import Arbitrary from './definition/Arbitrary'
import Shrinkable from './definition/Shrinkable'
import { array } from './ArrayArbitrary'
import { nat } from './IntegerArbitrary'
import { char, ascii, unicode, hexa, base64 } from './CharacterArbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

function StringArbitrary(charArb: Arbitrary<string>, maxLength?: number) {
    const arrayArb = maxLength === undefined
            ? array(charArb)
            : array(charArb, maxLength);
    return arrayArb.map(tab => tab.join(''));
}

function Base64StringArbitrary(maxLength: number) {
    assert.equal(maxLength % 4, 0, 'Maximal length of base64 strings must be a multiple of 4');
    return StringArbitrary(base64(), maxLength).map(s => {
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
function string(maxLength?: number): Arbitrary<string> {
    return StringArbitrary(char(), maxLength);
}

function asciiString(): Arbitrary<string>;
function asciiString(maxLength: number): Arbitrary<string>;
function asciiString(maxLength?: number): Arbitrary<string> {
    return StringArbitrary(ascii(), maxLength);
}

function unicodeString(): Arbitrary<string>;
function unicodeString(maxLength: number): Arbitrary<string>;
function unicodeString(maxLength?: number): Arbitrary<string> {
    return StringArbitrary(unicode(), maxLength);
}

function hexaString(): Arbitrary<string>;
function hexaString(maxLength: number): Arbitrary<string>;
function hexaString(maxLength?: number): Arbitrary<string> {
    return StringArbitrary(hexa(), maxLength);
}

function base64String(): Arbitrary<string>;
function base64String(maxLength: number): Arbitrary<string>;
function base64String(maxLength?: number): Arbitrary<string> {
    const length = maxLength == null ? 16 : maxLength;
    return Base64StringArbitrary(length - length%4); // base64 length is always a multiple of 4
}

export { string, asciiString, unicodeString, hexaString, base64String };
