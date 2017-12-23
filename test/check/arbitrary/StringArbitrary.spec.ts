import * as assert from 'power-assert';
import { DummyRandomGenerator } from './TestRandomGenerator'
import MutableRandomGenerator from '../../../src/random/generator/MutableRandomGenerator';
import { string, asciiString, unicodeString, hexaString, base64String } from '../../../src/check/arbitrary/StringArbitrary';
import * as jsc from 'jsverify';

describe('StringArbitrary', () => {
    describe('char', () => {
        it('Should generate printable characters', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = string().generate(mrng).value;
                return g.split('').every(c => 0x20 <= c.charCodeAt(0) && c.charCodeAt(0) <= 0x7e);
            })
        ));
        it('Should generate a string given maximal length', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer(0, 10000), (seed, maxLength) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = string(maxLength).generate(mrng).value;
                return g.length <= maxLength;
            })
        ));
    });
    describe('asciiString', () => {
        it('Should generate ascii string', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = asciiString().generate(mrng).value;
                return g.split('').every(c => 0x00 <= c.charCodeAt(0) && c.charCodeAt(0) <= 0x7f);
            })
        ));
        it('Should generate a string given maximal length', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer(0, 10000), (seed, maxLength) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = asciiString(maxLength).generate(mrng).value;
                return g.length <= maxLength;
            })
        ));
    });
    describe('unicodeString', () => {
        it('Should generate unicode string', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = unicodeString().generate(mrng).value;
                return g.split('').every(c => 0x0000 <= c.charCodeAt(0) && c.charCodeAt(0) <= 0xffff);
            })
        ));
        it('Should generate a string given maximal length', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer(0, 10000), (seed, maxLength) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = unicodeString(maxLength).generate(mrng).value;
                return g.length <= maxLength;
            })
        ));
    });
    describe('hexaString', () => {
        it('Should generate hexa string', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = hexaString().generate(mrng).value;
                return g.split('').every(c => ('0' <= c && c <= '9') || ('a' <= c && c <= 'f'));
            })
        ));
        it('Should generate a string given maximal length', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer(0, 10000), (seed, maxLength) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = hexaString(maxLength).generate(mrng).value;
                return g.length <= maxLength;
            })
        ));
    });
    describe('base64', () => {
        function isValidBase64(g: string) {
            const valid = (c: string) => (
                ('a' <= c && c <= 'z') ||
                ('A' <= c && c <= 'Z') ||
                ('0' <= c && c <= '9') ||
                c === '+' || c === '/'
            );
            const padStart = g.indexOf('=');
            return g.substr(0, padStart === -1 ? g.length : padStart)
                    .split('').every(valid);
        }
        function hasValidBase64Padding(g: string) {
            const padStart = g.indexOf('=');
            return g.substr(padStart === -1 ? g.length : padStart).split('').every(c => c === '=');
        }
        it('Should generate base64 string', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = base64String().generate(mrng).value;
                return isValidBase64(g);
            })
        ));
        it('Should pad base64 string with spaces', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = base64String().generate(mrng).value;
                return hasValidBase64Padding(g);
            })
        ));
        it('Should have a length multiple of 4', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = base64String().generate(mrng).value;
                return g.length % 4 === 0;
            })
        ));
        it('Should generate a string given maximal length', () => jsc.assert(
            jsc.forall(jsc.integer, jsc.integer(0, 10000), (seed, maxLength) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const g = base64String(maxLength).generate(mrng).value;
                return g.length <= maxLength;
            })
        ));
        it('Should shrink and suggest valid base64 strings', () => jsc.assert(
            jsc.forall(jsc.integer, (seed) => {
                const mrng = new MutableRandomGenerator(new DummyRandomGenerator(seed));
                const shrinkable = base64String().generate(mrng);
                return shrinkable.shrink()
                    .every(s => s.value.length % 4 === 0 &&
                                isValidBase64(s.value) &&
                                hasValidBase64Padding(s.value));
            })
        ));
    });
});
