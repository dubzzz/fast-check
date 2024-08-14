import { describe, expect, it } from 'vitest';
import * as prand from 'pure-rand';
import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`Generate all values (seed: ${seed})`, () => {
  /**
   * Check the ability of arbitraries to generate all the values
   * of their type / range
   */
  const lookForMissing = <T>(arb: fc.Arbitrary<T>, expectedSize: number): void => {
    const mrng = new fc.Random(prand.xorshift128plus(seed));
    const alreadySeen = new Set<T>();
    while (alreadySeen.size < expectedSize) {
      const value = arb.generate(mrng, undefined).value;
      if (alreadySeen.has(value)) continue;
      alreadySeen.add(value);
    }
  };
  describe('fc.boolean()', () => {
    it('Should be able to produce true and false', () => lookForMissing(fc.boolean(), 2));
  });
  describe('fc.integer()', () => {
    it('Should be able to produce all integer values within the range', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(100), (from, gap) =>
          lookForMissing(fc.integer({ min: from, max: from + gap }), gap + 1),
        ),
      ));
  });
  describe('fc.char()', () => {
    it('Should be able to produce any printable character', () => lookForMissing(fc.char(), 95));
  });
  describe('fc.ascii()', () => {
    it('Should be able to produce any character from ascii', () => lookForMissing(fc.ascii(), 128));
  });
  describe('fc.char16bits()', () => {
    it('Should be able to produce any 16 bits character', () => lookForMissing(fc.char16bits(), 65536));
  });
  describe('fc.unicode()', () => {
    const numCharacters = 65536 - (0xdfff - 0xd800 + 1);
    it('Should be able to produce any character from unicode (UCS-2 subset only)', () =>
      lookForMissing(fc.unicode(), numCharacters));
  });
  describe('fc.hexa()', () => {
    it('Should be able to produce any character from hexa', () => lookForMissing(fc.hexa(), 16));
  });
  describe('fc.base64()', () => {
    it('Should be able to produce any character from base64', () => lookForMissing(fc.base64(), 64));
  });
  describe('fc.constantFrom()', () => {
    it('Should be able to produce all the constants', () =>
      fc.assert(
        fc.property(fc.uniqueArray(fc.string(), { minLength: 1, maxLength: 40 }), (csts) =>
          lookForMissing(fc.constantFrom(...csts), csts.length),
        ),
      ));
  });
  describe('fc.anything()', () => {
    const checkCanProduce = (
      label: string,
      typeofLabel: string,
      toStringLabel: string,
      additionalCheck?: (v: unknown) => boolean,
    ) => {
      it(`should be able to generate ${label}`, () => {
        let numTries = 0;
        const mrng = new fc.Random(prand.xorshift128plus(seed));
        const arb = fc.anything({
          withBoxedValues: true,
          withMap: true,
          withSet: true,
          withObjectString: true,
          withNullPrototype: true,
          withDate: true,
          withTypedArray: true,
          withSparseArray: true,
          withUnicodeString: true,
          withBigInt: true,
        });
        while (++numTries <= 10000) {
          const { value } = arb.generate(mrng, undefined);
          if (typeof value === typeofLabel && Object.prototype.toString.call(value) === toStringLabel) {
            if (additionalCheck === undefined || additionalCheck(value)) {
              return;
            }
          }
        }
        expect(`Was not able to generate ${label}`).toBe(null);
      });
    };
    checkCanProduce('null', 'object', '[object Null]');
    checkCanProduce('undefined', 'undefined', '[object Undefined]');
    checkCanProduce('boolean', 'boolean', '[object Boolean]');
    checkCanProduce('number', 'number', '[object Number]');
    checkCanProduce('string', 'string', '[object String]');
    checkCanProduce('boxed Boolean', 'object', '[object Boolean]');
    checkCanProduce('boxed Number', 'object', '[object Number]');
    checkCanProduce('boxed String', 'object', '[object String]');
    checkCanProduce('object', 'object', '[object Object]');
    checkCanProduce('Array', 'object', '[object Array]');
    checkCanProduce('Set', 'object', '[object Set]');
    checkCanProduce('Map', 'object', '[object Map]');
    checkCanProduce('Date', 'object', '[object Date]');
    checkCanProduce('Int8Array', 'object', '[object Int8Array]');
    checkCanProduce('Uint8Array', 'object', '[object Uint8Array]');
    checkCanProduce('Uint8ClampedArray', 'object', '[object Uint8ClampedArray]');
    checkCanProduce('Int16Array', 'object', '[object Int16Array]');
    checkCanProduce('Uint16Array', 'object', '[object Uint16Array]');
    checkCanProduce('Int32Array', 'object', '[object Int32Array]');
    checkCanProduce('Uint32Array', 'object', '[object Uint32Array]');
    checkCanProduce('Float32Array', 'object', '[object Float32Array]');
    checkCanProduce('Float64Array', 'object', '[object Float64Array]');
    checkCanProduce('null prototype object', 'object', '[object Object]', (instance: unknown) => {
      return Object.getPrototypeOf(instance) === null;
    });
    checkCanProduce('BigInt', 'bigint', '[object BigInt]');
  });
});
