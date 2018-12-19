import * as fc from '../../../lib/fast-check';

import {
  ObjectEntries,
  StringPadEnd,
  StringPadStart,
  ObjectEntriesImpl,
  StringPadEndImpl,
  StringPadStartImpl,
  StringFromCodePointLimitedImpl,
  StringFromCodePointLimited
} from '../../../src/utils/polyfills';

declare module Object {
  function entries(o: { [key: string]: any }): [string, any][];
}
declare module String {
  function fromCodePoint(codePoint: number): string;
}
declare class String {
  public padEnd(src: string, targetLength: number, padString: string): string;
  public padStart(src: string, targetLength: number, padString: string): string;
}

describe('polyfills', () => {
  describe('Object.entries', () => {
    if (Object.entries) {
      it('Should give the same answer as built-it entries', () =>
        fc.assert(
          fc.property(fc.dictionary(fc.fullUnicodeString(), fc.fullUnicodeString()), d => {
            expect(ObjectEntriesImpl(d)).toEqual(Object.entries(d));
          })
        ));
    }
    it('Should provide a working polyfilled implementation', () => {
      if (Object.entries) expect(ObjectEntries === Object.entries).toBe(true);
      else expect(ObjectEntries === ObjectEntriesImpl).toBe(true);
    });
  });
  describe('String.fromCodePoint', () => {
    if (String.fromCodePoint) {
      it('Should give the same answer as built-it entries', () =>
        fc.assert(
          fc.property(fc.nat(0x10ffff), code => {
            expect(StringFromCodePointLimitedImpl(code)).toEqual(String.fromCodePoint(code));
          })
        ));
    }
    it('Should provide a working polyfilled implementation', () => {
      if (String.fromCodePoint) expect(StringFromCodePointLimited === String.fromCodePoint).toBe(true);
      else expect(StringFromCodePointLimited === StringFromCodePointLimitedImpl).toBe(true);
    });
  });
  describe('String.prototype.padEnd', () => {
    if (String.prototype.padEnd) {
      it('Should give the same answer as built-it padEnd', () =>
        fc.assert(
          fc.property(
            fc.fullUnicodeString(),
            fc.nat(1000),
            fc.fullUnicodeString(),
            (src, l, pad) => StringPadEndImpl(src, l, pad) === (src as any).padEnd(l, pad)
          )
        ));
    }
    it('Should provide a working polyfilled implementation', () =>
      fc.assert(
        fc.property(
          fc.fullUnicodeString(),
          fc.nat(1000),
          fc.fullUnicodeString(),
          (src, l, pad) => StringPadEnd(src, l, pad) === StringPadEndImpl(src, l, pad)
        )
      ));
  });
  describe('String.prototype.padStart', () => {
    if (String.prototype.padStart) {
      it('Should give the same answer as built-it padStart', () =>
        fc.assert(
          fc.property(
            fc.fullUnicodeString(),
            fc.nat(1000),
            fc.fullUnicodeString(),
            (src, l, pad) => StringPadStartImpl(src, l, pad) === (src as any).padStart(l, pad)
          )
        ));
    }
    it('Should provide a working polyfilled implementation', () =>
      fc.assert(
        fc.property(
          fc.fullUnicodeString(),
          fc.nat(1000),
          fc.fullUnicodeString(),
          (src, l, pad) => StringPadStart(src, l, pad) === StringPadStartImpl(src, l, pad)
        )
      ));
  });
});
