import Arbitrary from './Arbitrary'
import { integer } from './IntegerArbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'

class CharacterArbitrary implements Arbitrary<string> {
    readonly arb: Arbitrary<number>;
    constructor(min: number, max: number, readonly map: (v: number) => number = v => v) {
        this.arb = integer(min, max);
    }
    generate(mrng: MutableRandomGenerator): string {
        return String.fromCharCode(
            this.map(
                this.arb.generate(mrng)));
    }
}

function char(): CharacterArbitrary {
    // Only printable characters: https://www.ascii-code.com/
    return new CharacterArbitrary(0x20, 0x7e);
}
function hexa(): CharacterArbitrary {
    function mapper(v: number) {
        return (v < 10)
            ? v + 48      // 0-9
            : v + 97 -10; // a-f
    }
    return new CharacterArbitrary(0, 15, mapper);
}
function base64(): CharacterArbitrary {
    function mapper(v: number) {
        if (v < 26) return v + 65;     // A-Z
        if (v < 52) return v + 97 -26; // a-z
        if (v < 62) return v + 48 -52; // 0-9
        return v === 62 ? 43 : 47;     // +/
    }
    return new CharacterArbitrary(0, 63, mapper);
}

function ascii(): CharacterArbitrary {
    return new CharacterArbitrary(0x00, 0x7f);
}
function unicode(): CharacterArbitrary {
    return new CharacterArbitrary(0x0000, 0xffff);
}

export { char, ascii, unicode, hexa, base64 };
