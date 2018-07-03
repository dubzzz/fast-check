import * as assert from 'assert';
import * as fc from '../../../lib/fast-check';

import {
  ObjectEntries,
  StringPadEnd,
  StringPadStart,
  ObjectEntriesImpl,
  StringPadEndImpl,
  StringPadStartImpl
} from '../../../src/check/polyfills';

describe('polyfills', () => {
  describe('Object.entries', () => {
    if (Object.entries) {
      it('Should give the same answer as built-it entries', () =>
        fc.assert(
          fc.property(fc.dictionary(fc.fullUnicodeString(), fc.fullUnicodeString()), d => {
            assert.deepStrictEqual(ObjectEntriesImpl(d), Object.entries(d));
          })
        ));
    }
    it('Should provide a working polyfilled implementation', () => {
      if (Object.entries) assert.ok(ObjectEntries === Object.entries);
      else assert.ok(ObjectEntries === ObjectEntriesImpl);
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
            (src, l, pad) => StringPadEndImpl(src, l, pad) === src.padEnd(l, pad)
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
            (src, l, pad) => StringPadStartImpl(src, l, pad) === src.padStart(l, pad)
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
