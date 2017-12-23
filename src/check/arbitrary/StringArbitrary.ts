import * as assert from 'power-assert'
import Arbitrary from './definition/Arbitrary'
import Shrinkable from './definition/Shrinkable'
import { array } from './ArrayArbitrary'
import { nat } from './IntegerArbitrary'
import { char, ascii, unicode, hexa, base64 } from './CharacterArbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

class StringArbitrary extends Arbitrary<string> {
    readonly arrayArb: Arbitrary<string[]>;
    constructor(charArb: Arbitrary<string>, maxLength?: number) {
        super();
        this.arrayArb = maxLength === undefined
                ? array(charArb)
                : array(charArb, maxLength);
    }
    generate(mrng: MutableRandomGenerator): Shrinkable<string> {
        return this.arrayArb.generate(mrng)
                .map(tab => tab.join(''));
    }
}

class Base64StringArbitrary extends Arbitrary<string> {
    readonly strArb: Arbitrary<string>;
    constructor(maxLength: number) {
        super();
        assert.equal(maxLength % 4, 0, 'Maximal length of base64 strings must be a multiple of 4');
        this.strArb = new StringArbitrary(base64(), maxLength);
    }
    generate(mrng: MutableRandomGenerator): Shrinkable<string> {
        return this.strArb.generate(mrng)
            .map(s => {
                switch (s.length % 4) {
                    case 0: return s;
                    case 3: return `${s}=`;
                    case 2: return `${s}==`;
                }
                return s.slice(1); //remove one extra char to get to %4 == 0
            });
    }
}

function string(): Arbitrary<string>;
function string(maxLength: number): Arbitrary<string>;
function string(maxLength?: number): Arbitrary<string> {
    return new StringArbitrary(char(), maxLength);
}

function asciiString(): Arbitrary<string>;
function asciiString(maxLength: number): Arbitrary<string>;
function asciiString(maxLength?: number): Arbitrary<string> {
    return new StringArbitrary(ascii(), maxLength);
}

function unicodeString(): Arbitrary<string>;
function unicodeString(maxLength: number): Arbitrary<string>;
function unicodeString(maxLength?: number): Arbitrary<string> {
    return new StringArbitrary(unicode(), maxLength);
}

function hexaString(): Arbitrary<string>;
function hexaString(maxLength: number): Arbitrary<string>;
function hexaString(maxLength?: number): Arbitrary<string> {
    return new StringArbitrary(hexa(), maxLength);
}

function base64String(): Arbitrary<string>;
function base64String(maxLength: number): Arbitrary<string>;
function base64String(maxLength?: number): Arbitrary<string> {
    const length = maxLength == null ? 16 : maxLength;
    return new Base64StringArbitrary(length - length%4); // base64 length is always a multiple of 4
}

export { string, asciiString, unicodeString, hexaString, base64String };
