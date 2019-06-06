import * as prand from 'pure-rand';
import * as fc from '../../src/fast-check';

const seed = Date.now();
describe(`Generate all values (seed: ${seed})`, () => {
  /**
   * Check the ability of arbitraries to generate all the values
   * of their type / range
   */
  const lookForMissing = <T>(arb: fc.Arbitrary<T>, missing: number): void => {
    const mrng = new fc.Random(prand.xorshift128plus(seed));
    const alreadySeen: any = {};
    while (missing > 0) {
      const g = (arb.generate(mrng).value as any).toString();
      if (alreadySeen[g]) continue;
      alreadySeen[g] = true;
      --missing;
    }
  };
  describe('fc.boolean()', () => {
    it('Should be able to produce true and false', () => lookForMissing(fc.boolean(), 2));
  });
  describe('fc.integer()', () => {
    it('Should be able to produce all integer values within the range', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(100), (from, gap) => lookForMissing(fc.integer(from, from + gap), gap + 1))
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
        fc.property(fc.set(fc.string(), 1, 40), csts => lookForMissing(fc.constantFrom(...csts), csts.length))
      ));
  });
  describe('fc.anything()', () => {
    const checkCanProduce = (label: string, typeofLabel: string, toStringLabel: string) => {
      it(`should be able to generate ${label}`, () => {
        let numTries = 0;
        const mrng = new fc.Random(prand.xorshift128plus(seed));
        const arb = fc.anything({ withBoxedValues: true, withMap: true, withSet: true });
        while (++numTries <= 10000) {
          const { value } = arb.generate(mrng);
          if (typeof value === typeofLabel && Object.prototype.toString.call(value) === toStringLabel) {
            return;
          }
        }
        fail(`Was not able to generate ${label}`);
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
    checkCanProduce('Array', 'object', '[object Array]');
    checkCanProduce('Set', 'object', '[object Set]');
    checkCanProduce('Map', 'object', '[object Map]');
  });
});
