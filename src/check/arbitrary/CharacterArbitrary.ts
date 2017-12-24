import Arbitrary from './definition/Arbitrary'
import Shrinkable from './definition/Shrinkable'
import { integer } from './IntegerArbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import { Stream, stream } from '../../stream/Stream'

function CharacterArbitrary(min: number, max: number, mapToCode: (v: number) => number = v => v) {
    return integer(min, max).map(n => String.fromCharCode(mapToCode(n)));
}

function char(): Arbitrary<string> {
    // Only printable characters: https://www.ascii-code.com/
    return CharacterArbitrary(0x20, 0x7e);
}
function hexa(): Arbitrary<string> {
    function mapper(v: number) {
        return (v < 10)
            ? v + 48      // 0-9
            : v + 97 -10; // a-f
    }
    return CharacterArbitrary(0, 15, mapper);
}
function base64(): Arbitrary<string> {
    function mapper(v: number) {
        if (v < 26) return v + 65;     // A-Z
        if (v < 52) return v + 97 -26; // a-z
        if (v < 62) return v + 48 -52; // 0-9
        return v === 62 ? 43 : 47;     // +/
    }
    return CharacterArbitrary(0, 63, mapper);
}

function ascii(): Arbitrary<string> {
    return CharacterArbitrary(0x00, 0x7f);
}
function unicode(): Arbitrary<string> {
    return CharacterArbitrary(0x0000, 0xffff);
}

export { char, ascii, unicode, hexa, base64 };
