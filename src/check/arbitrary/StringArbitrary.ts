import * as assert from 'power-assert'
import Arbitrary from './Arbitrary'
import { array } from './ArrayArbitrary'
import { nat } from './IntegerArbitrary'
import { char, ascii, unicode, hexa, base64 } from './CharacterArbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

class StringArbitrary implements Arbitrary<string> {
    readonly arrayArb: Arbitrary<string[]>;
    constructor(charArb: Arbitrary<string>, maxLength?: number) {
        this.arrayArb = maxLength === undefined
                ? array(charArb)
                : array(charArb, maxLength);
    }
    generate(mrng: MutableRandomGenerator): string {
        return this.arrayArb.generate(mrng).join('');
    }
}

class Base64StringArbitrary implements Arbitrary<string> {
    readonly strArb: Arbitrary<string>;
    constructor(maxLength: number) {
        assert.equal(maxLength % 4, 0, 'Maximal length of base64 strings must be a multiple of 4');
        this.strArb = new StringArbitrary(base64(), maxLength);
    }
    generate(mrng: MutableRandomGenerator): string {
        const s = this.strArb.generate(mrng);
        switch (s.length % 4) {
            case 0: return s;
            case 3: return `${s}=`;
            case 2: return `${s}==`;
        }
        return s.slice(1); //remove one extra char to get to %4 == 0
    }
}

function string(): StringArbitrary;
function string(maxLength: number): StringArbitrary;
function string(maxLength?: number): StringArbitrary {
    return new StringArbitrary(char(), maxLength);
}

function asciiString(): StringArbitrary;
function asciiString(maxLength: number): StringArbitrary;
function asciiString(maxLength?: number): StringArbitrary {
    return new StringArbitrary(ascii(), maxLength);
}

function unicodeString(): StringArbitrary;
function unicodeString(maxLength: number): StringArbitrary;
function unicodeString(maxLength?: number): StringArbitrary {
    return new StringArbitrary(unicode(), maxLength);
}

function hexaString(): StringArbitrary;
function hexaString(maxLength: number): StringArbitrary;
function hexaString(maxLength?: number): StringArbitrary {
    return new StringArbitrary(hexa(), maxLength);
}

function base64String(): Base64StringArbitrary;
function base64String(maxLength: number): Base64StringArbitrary;
function base64String(maxLength?: number): Base64StringArbitrary {
    const length = maxLength || 16;
    return new Base64StringArbitrary(length - length%4); // base64 length is always a multiple of 4
}

export { string, asciiString, unicodeString, hexaString, base64String };
