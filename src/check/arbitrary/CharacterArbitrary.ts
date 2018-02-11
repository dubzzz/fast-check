import Arbitrary from './definition/Arbitrary'
import Shrinkable from './definition/Shrinkable'
import { integer } from './IntegerArbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import { Stream, stream } from '../../stream/Stream'

function CharacterArbitrary(min: number, max: number, mapToCode: (v: number) => number = v => v) {
    return integer(min, max).map(n => String.fromCodePoint(mapToCode(n)));
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
    // Characters in the range: U+D800 to U+DFFF
    // are called 'surrogate pairs', they cannot be defined alone and come by pairs
    // JavaScript function 'fromCodePoint' can handle those
    // This unicode builder is able to produce a subset of UTF-16 characters called UCS-2
    // You can refer to 'fromCharCode' documentation for more details
    const gapSize = 0xdfff +1 - 0xd800;
    function mapping(v: number) {
        if (v < 0xd800) return v;
        return v + gapSize;
    }
    return CharacterArbitrary(0x0000, 0xffff - gapSize, mapping);
}
function fullUnicode(): Arbitrary<string> {
    // Be aware that 'characters' can have a length greater than 1
    // More details on: https://tc39.github.io/ecma262/#sec-utf16encoding
    const gapSize = 0xdfff +1 - 0xd800;
    function mapping(v: number) {
        if (v < 0xd800) return v;
        return v + gapSize;
    }
    return CharacterArbitrary(0x0000, 0x10ffff - gapSize, mapping);
}


export { char, ascii, unicode, fullUnicode, hexa, base64 };
