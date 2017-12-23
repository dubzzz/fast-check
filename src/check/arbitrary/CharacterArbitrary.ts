import Arbitrary from './definition/Arbitrary'
import Shrinkable from './definition/Shrinkable'
import { integer } from './IntegerArbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import { Stream, stream } from '../../stream/Stream'

class CharacterArbitrary extends Arbitrary<string> {
    readonly arb: Arbitrary<number>;
    constructor(min: number, max: number,
            readonly map: (v: number) => number = v => v,
            readonly unmap: (v: number) => number = v => v) {
        super();
        this.arb = integer(min, max);
    }
    private mapper(n: number): string {
        return String.fromCharCode(this.map(n));
    }
    generate(mrng: MutableRandomGenerator): Shrinkable<string> {
        return this.arb.generate(mrng)
                .map(n => this.mapper(n));
    }
}

function char(): Arbitrary<string> {
    // Only printable characters: https://www.ascii-code.com/
    return new CharacterArbitrary(0x20, 0x7e);
}
function hexa(): Arbitrary<string> {
    function mapper(v: number) {
        return (v < 10)
            ? v + 48      // 0-9
            : v + 97 -10; // a-f
    }
    function unmapper(v: number) {
        return (v >= 48 && v < 58)
            ? v - 48      // 0-9
            : v - 97 +10; // a-f
    }
    return new CharacterArbitrary(0, 15, mapper, unmapper);
}
function base64(): Arbitrary<string> {
    function mapper(v: number) {
        if (v < 26) return v + 65;     // A-Z
        if (v < 52) return v + 97 -26; // a-z
        if (v < 62) return v + 48 -52; // 0-9
        return v === 62 ? 43 : 47;     // +/
    }
    function unmapper(v: number) {
        if (v >= 65 && v < 65 + 26) return v - 65;     // A-Z
        if (v >= 97 && v < 97 + 26) return v - 97 +26; // a-z
        if (v >= 48 && v < 48 + 10) return v - 48 +52; // 0-9
        return v === 43 ? 62 : 63;                     // +/
    }
    return new CharacterArbitrary(0, 63, mapper, unmapper);
}

function ascii(): Arbitrary<string> {
    return new CharacterArbitrary(0x00, 0x7f);
}
function unicode(): Arbitrary<string> {
    return new CharacterArbitrary(0x0000, 0xffff);
}

export { char, ascii, unicode, hexa, base64 };
