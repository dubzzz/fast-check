import * as fc from '../../../../lib/fast-check';

import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { constant } from '../../../../src/check/arbitrary/ConstantArbitrary';
import { integer } from '../../../../src/check/arbitrary/IntegerArbitrary';
import { oneof } from '../../../../src/check/arbitrary/OneOfArbitrary';
import { Random } from '../../../../src/random/generator/Random';
import { stream } from '../../../../src/stream/Stream';

import * as genericHelper from './generic/GenericArbitraryHelper';

import * as stubRng from '../../stubs/generators';

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

    const seedGenerator = fc.record(
      {
        data: fc.array(fc.record({ type: fc.constantFrom('unique', 'range'), value: fc.nat() }), {
          minLength: 1,
        }),
        constraints: fc.record({ withCrossShrink: fc.boolean() }),
      },
      { requiredKeys: ['data'] }
    );
    type SeedGeneratorType = typeof seedGenerator extends fc.Arbitrary<infer T> ? T : never;

    genericHelper.isValidArbitrary(
      (metas: SeedGeneratorType) => {
        const arbs = metas.data.map((m) => (m.type === 'unique' ? constant(m.value) : integer(m.value - 10, m.value)));
        if (metas.constraints === undefined) {
          return oneof(...arbs);
        }
        return oneof(metas.constraints, ...arbs);
      },
      {
        seedGenerator,
        isValidValue: (v: number, metas: SeedGeneratorType) => {
          for (const m of metas.data) {
            if (m.type === 'unique' && m.value === v) return true;
            if (m.type === 'range' && m.value - 10 <= v && v <= m.value) return true;
          }
          return false;
        },
        isStrictlySmallerValue: (a: number, b: number, metas: SeedGeneratorType) => {
          // When withCrossShrink is not toggled, the shrinker cannot jump from one arbitrary to another
          if (metas.constraints !== undefined && metas.constraints.withCrossShrink) {
            const canBeInFirstArbitrary =
              metas.data[0].type === 'unique'
                ? metas.data[0].value === a
                : metas.data[0].value - 10 <= a && a <= metas.data[0].value;
            if (canBeInFirstArbitrary) {
              // a is possibly coming from our first arbitrary
              return true;
            }
          }
          return Math.abs(b - a) <= 10 && b > 0 ? b - a > 0 : b - a < 0;
        },
      }
    );
  });
});
