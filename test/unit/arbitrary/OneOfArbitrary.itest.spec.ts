import * as fc from '../../../lib/fast-check';

import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { Shrinkable } from '../../../src/check/arbitrary/definition/Shrinkable';
import { constant } from '../../../src/check/arbitrary/ConstantArbitrary';
import { integer } from '../../../src/arbitrary/integer';
import { oneof } from '../../../src/arbitrary/oneof';
import { Random } from '../../../src/random/generator/Random';
import { stream } from '../../../src/stream/Stream';

import * as genericHelper from '../check//arbitrary/generic/GenericArbitraryHelper';

import * as stubRng from '../stubs/generators';

class CustomArbitrary extends Arbitrary<number> {
  constructor(readonly value: number) {
    super();
  }
  generate(_mrng: Random): Shrinkable<number> {
    function* g(v: number) {
      yield new Shrinkable(v - 42);
    }
    return new Shrinkable(this.value, () => stream(g(this.value)));
  }
}

describe('OneOfArbitrary', () => {
  describe('oneof', () => {
    it('Should generate based on one of the given arbitraries', () =>
      fc.assert(
        fc.property(fc.integer(), fc.array(fc.integer(), { minLength: 1 }), (seed, choices) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = oneof(...choices.map(constant)).generate(mrng).value;
          return choices.indexOf(g) !== -1;
        })
      ));
    it('Should call the right shrink on shrink', () =>
      fc.assert(
        fc.property(fc.integer(), fc.array(fc.integer(), { minLength: 1 }), (seed, choices) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const shrinkable = oneof(...choices.map((c) => new CustomArbitrary(c))).generate(mrng);
          const shrinks = [...shrinkable.shrink()];
          return shrinks.length === 1 && shrinks[0].value === shrinkable.value - 42;
        })
      ));
    it('Should reject calls without any arbitraries', () => {
      expect(() => oneof()).toThrowError();
    });

    genericHelper.isValidArbitrary(
      (metas: { type: string; value: number }[]) => {
        const arbs = metas.map((m) => (m.type === 'unique' ? constant(m.value) : integer(m.value - 10, m.value)));
        return oneof(...arbs);
      },
      {
        seedGenerator: fc.array(fc.record({ type: fc.constantFrom('unique', 'range'), value: fc.nat() }), {
          minLength: 1,
        }),
        isValidValue: (v: number, metas: { type: string; value: number }[]) =>
          metas.findIndex((m) => (m.type === 'unique' ? m.value === v : m.value - 10 <= v && v <= m.value)) !== -1,
        isStrictlySmallerValue: (a: number, b: number) => (Math.abs(b - a) <= 10 && b > 0 ? b - a > 0 : b - a < 0),
      }
    );
  });
});
