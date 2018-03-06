import * as assert from 'power-assert';
import fc from '../../../../lib/fast-check';

import { char, ascii, char16bits, unicode, hexa, base64, fullUnicode } from '../../../../src/check/arbitrary/CharacterArbitrary';

import * as stubRng from '../../stubs/generators';

describe("CharacterArbitrary", () => {
    describe('char', () => {
        it('Should generate a single printable character', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = stubRng.mutable.fastincrease(seed);
                const g = char().generate(mrng).value;
                return g.length === 1 && 0x20 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0x7e;
            })
        ));
        it('Should be able to produce any printable character', () => fc.assert(
            fc.property(fc.integer(), fc.integer(32, 126), (seed, selected) => {
                const mrng = stubRng.mutable.counter(seed);
                const arb = char();
                const waitingFor = String.fromCharCode(selected);
                for (let t = 0 ; t !== 96 ; ++t) { // check for equiprobable at the same time
                    if (arb.generate(mrng).value === waitingFor) {
                        return true;
                    }
                }
                throw `Unable to produce '${waitingFor}' (${selected}) given seed ${seed}`;
            })
        ));
    });
    describe('ascii', () => {
        it('Should generate a single ascii character', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = stubRng.mutable.fastincrease(seed);
                const g = ascii().generate(mrng).value;
                return g.length === 1 && 0x00 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0x7f;
            })
        ));
        it('Should be able to produce any character from ascii', () => fc.assert(
            fc.property(fc.integer(), fc.integer(0, 127), (seed, selected) => {
                const mrng = stubRng.mutable.counter(seed);
                const arb = ascii();
                const waitingFor = String.fromCharCode(selected);
                for (let t = 0 ; t !== 128 ; ++t) { // check for equiprobable at the same time
                    if (arb.generate(mrng).value === waitingFor) {
                        return true;
                    }
                }
                throw `Unable to produce '${waitingFor}' (${selected}) given seed ${seed}`;
            })
        ));
    });
    describe('char16bits', () => {
        it('Should generate a single 16 bits character', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = stubRng.mutable.fastincrease(seed);
                const g = char16bits().generate(mrng).value;
                return g.length === 1 && 0x0000 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0xffff;
            })
        ));
    });
    describe('unicode', () => {
        it('Should generate a single unicode character', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = stubRng.mutable.fastincrease(seed);
                const g = unicode().generate(mrng).value;
                return g.length === 1 &&
                        0x0000 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0xffff &&
                        !(0xd800 <= g.charCodeAt(0) && g.charCodeAt(0) <= 0xdfff); // surrogate pairs
            })
        ));
        it('Should be able to produce any character from unicode (UCS-2 subset only)', () => fc.assert(
            fc.property(fc.integer(), fc.integer(0, 0xffff).filter(v => v < 0xd800 || v > 0xdfff), (seed, selected) => {
                const mrng = stubRng.mutable.counter(seed);
                const arb = unicode();
                const waitingFor = String.fromCharCode(selected);
                for (let t = 0 ; t !== 65536 ; ++t) {
                    if (arb.generate(mrng).value === waitingFor) {
                        return true;
                    }
                }
                throw `Unable to produce '${waitingFor}' (${selected}) given seed ${seed}`;
            })
        ));
    });
    describe('fullUnicode', () => {
        it('Should generate a single unicode character', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = stubRng.mutable.fastincrease(seed);
                const g = fullUnicode().generate(mrng).value;
                return 0x0000 <= g.codePointAt(0) && g.codePointAt(0) <= 0x10ffff &&
                        !(0xd800 <= g.codePointAt(0) && g.codePointAt(0) <= 0xdfff); // surrogate pairs
            })
        ));
    });
    describe('hexa', () => {
        it('Should generate a single hexa character', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = stubRng.mutable.fastincrease(seed);
                const g = hexa().generate(mrng).value;
                return g.length === 1 && (('0' <= g && g <= '9') || ('a' <= g && g <= 'f'));
            })
        ));
        it('Should be able to produce any character from hexa', () => fc.assert(
            fc.property(fc.integer(), fc.integer(0, 15), (seed, selected) => {
                const mrng = stubRng.mutable.counter(seed);
                const arb = hexa();
                const waitingFor = '0123456789abcdef'[selected];
                for (let t = 0 ; t !== 16 ; ++t) { // check for equiprobable at the same time
                    if (arb.generate(mrng).value === waitingFor) {
                        return true;
                    }
                }
                throw `Unable to produce '${waitingFor}' (${selected}) given seed ${seed}`;
            })
        ));
        it('Should shrink within hexa characters', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = stubRng.mutable.fastincrease(seed);
                const shrinkable = hexa().generate(mrng);
                return shrinkable.shrink().every(s => 
                    s.value.length === 1 && (('0' <= s.value && s.value <= '9') || ('a' <= s.value && s.value <= 'f'))
                );
            })
        ));
    });
    describe('base64', () => {
        it('Should generate a single base64 character', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = stubRng.mutable.fastincrease(seed);
                const g = base64().generate(mrng).value;
                return g.length === 1 && (
                    ('a' <= g && g <= 'z') ||
                    ('A' <= g && g <= 'Z') ||
                    ('0' <= g && g <= '9') ||
                    g === '+' || g === '/'
                );
            })
        ));
        it('Should be able to produce any character from base64', () => fc.assert(
            fc.property(fc.integer(), fc.integer(0, 63), (seed, selected) => {
                const mrng = stubRng.mutable.counter(seed);
                const arb = base64();
                const waitingFor = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'[selected];
                for (let t = 0 ; t !== 64 ; ++t) { // check for equiprobable at the same time
                    if (arb.generate(mrng).value === waitingFor) {
                        return true;
                    }
                }
                throw `Unable to produce '${waitingFor}' (${selected}) given seed ${seed}`;
            })
        ));
        it('Should shrink within base64 characters', () => fc.assert(
            fc.property(fc.integer(), (seed) => {
                const mrng = stubRng.mutable.fastincrease(seed);
                const shrinkable = base64().generate(mrng);
                return shrinkable.shrink().every(s => 
                    s.value.length === 1 && (
                        ('a' <= s.value && s.value <= 'z') ||
                        ('A' <= s.value && s.value <= 'Z') ||
                        ('0' <= s.value && s.value <= '9') ||
                        s.value === '+' || s.value === '/'
                ));
            })
        ));
    });
});
