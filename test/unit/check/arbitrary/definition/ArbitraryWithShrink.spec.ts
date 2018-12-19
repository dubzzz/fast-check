import * as prand from 'pure-rand';
import * as fc from '../../../../../lib/fast-check';

import { ArbitraryWithShrink } from '../../../../../src/check/arbitrary/definition/ArbitraryWithShrink';
import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { Random } from '../../../../../src/random/generator/Random';
import { Stream, stream } from '../../../../../src/stream/Stream';

describe('ArbitraryWithShrink', () => {
  const arbWithShrink = new class extends ArbitraryWithShrink<number> {
    generate(mrng: Random): Shrinkable<number> {
      throw new Error('Method not implemented.');
    }
    shrink(value: number, shrunkOnce?: boolean): Stream<number> {
      function* g() {
        if (shrunkOnce === true) yield 0;
        yield* [...Array(value)].map((_, idx) => value + idx);
      }
      return stream(g());
    }
  }();
  it('Should produce a shrinkable from a value', () => {
    expect(arbWithShrink.shrinkableFor(5).value).toEqual(5);
  });
  it('Should be able to shrink a shrinkable derived from a value', () => {
    expect(
      Array.from(
        arbWithShrink
          .shrinkableFor(5)
          .shrink()
          .map(s => s.value)
      )
    ).toEqual([5, 6, 7, 8, 9]);
  });
  it('Should be able to shrink multiple times a shrinkable derived from a value', () => {
    expect(
      Array.from(
        arbWithShrink
          .shrinkableFor(5)
          .shrink()
          .getNthOrLast(2)!
          .shrink()
          .map(s => s.value)
      )
    ).toEqual([0, 7, 8, 9, 10, 11, 12, 13]);
  });

  const smallIntWithShrink = new class extends ArbitraryWithShrink<number> {
    private wrapper(value: number, shrunkOnce: boolean): Shrinkable<number> {
      return new Shrinkable(value, () => this.shrink(value, shrunkOnce).map(v => this.wrapper(v, true)));
    }
    generate(mrng: Random): Shrinkable<number> {
      return this.wrapper(mrng.nextInt(0, 10), false);
    }
    shrink(value: number, shrunkOnce?: boolean): Stream<number> {
      function* g() {
        if (shrunkOnce !== true) yield 0;
        for (let nv = value - 1; nv > 0; --nv) yield nv;
      }
      return stream(g());
    }
  }();
  it('Should produce the same shrunk values as the generated shrinkable', () => {
    fc.assert(
      fc.property(fc.integer().noShrink(), fc.nat(), (seed, mod) => {
        const mrng = new Random(prand.xorshift128plus(seed));
        const generated = smallIntWithShrink.generate(mrng);
        const fromValue = smallIntWithShrink.shrinkableFor(generated.value);

        // Browsing shrinking trees in order to check if there is a mismatch somewhere
        // Only consider a single path of the tree, does not check all the branches
        let generatedShrinks = generated.shrink();
        let fromValueShrinks = fromValue.shrink();
        while (true) {
          const generatedTab = Array.from(generatedShrinks);
          const fromValueTab = Array.from(fromValueShrinks);
          expect(generatedTab.map(s => s.value)).toEqual(fromValueTab.map(s => s.value));
          if (generatedTab.length === 0) break;
          generatedShrinks = generatedTab[mod % generatedTab.length].shrink();
          fromValueShrinks = fromValueTab[mod % fromValueTab.length].shrink();
        }
      })
    );
  });
});
