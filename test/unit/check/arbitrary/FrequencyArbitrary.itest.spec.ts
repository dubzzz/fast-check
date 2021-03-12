import * as fc from '../../../../lib/fast-check';

import { frequency } from '../../../../src/check/arbitrary/FrequencyArbitrary';
import { integer } from '../../../../src/check/arbitrary/IntegerArbitrary';
import { constant } from '../../../../src/check/arbitrary/ConstantArbitrary';
import { getDepthContextFor } from '../../../../src/check/arbitrary/helpers/DepthContext';
import { Random } from '../../../../src/random/generator/Random';

import * as genericHelper from './generic/GenericArbitraryHelper';

describe('FrequencyArbitrary', () => {
  describe('frequency', () => {
    const seedGenerator = fc.record(
      {
        data: fc
          .array(
            fc.record({
              type: fc.constantFrom('unique', 'range'),
              value: fc.nat(),
              weight: fc.nat(),
            }),
            { minLength: 1 }
          )
          .filter((config) => {
            const totalWeight = config.reduce((acc, e) => acc + e.weight, 0);
            return totalWeight > 0;
          }),
        constraints: fc.record(
          {
            withCrossShrink: fc.boolean(),
            depthFactor: fc.double({ min: 0, max: Number.MAX_VALUE, noNaN: true }),
            maxDepth: fc.nat(),
            depthIdentifierMetas: fc.record(
              {
                identifier: fc.constantFrom('toto', 'titi', 'tata'), // no need to have thousands of them
                initial: fc.nat(),
              },
              { requiredKeys: ['identifier', 'initial'] }
            ),
          },
          { requiredKeys: [] }
        ),
      },
      { requiredKeys: ['data'] }
    );

    type SeedGeneratorType = typeof seedGenerator extends fc.Arbitrary<infer T> ? T : never;

    function canProduce(dataFromMetas: SeedGeneratorType['data'][number], value: number): boolean {
      switch (dataFromMetas.type) {
        case 'unique':
          return dataFromMetas.value === value;
        case 'range':
          return dataFromMetas.value - 10 <= value && value <= dataFromMetas.value;
      }
      return false;
    }

    genericHelper.isValidArbitrary(
      (metas: SeedGeneratorType) => {
        const arbs = metas.data.map((m) =>
          m.type === 'unique'
            ? { arbitrary: constant(m.value), weight: m.weight }
            : { arbitrary: integer(m.value - 10, m.value), weight: m.weight }
        );
        if (metas.constraints === undefined) {
          return frequency(...arbs);
        }
        const sanitizedConstraints =
          metas.constraints.depthIdentifierMetas !== undefined
            ? { ...metas.constraints, depthIdentifier: metas.constraints.depthIdentifierMetas.identifier }
            : metas.constraints;
        const arb = frequency(sanitizedConstraints, ...arbs);
        if (metas.constraints.depthIdentifierMetas !== undefined) {
          const { identifier, initial } = metas.constraints.depthIdentifierMetas;
          const originalGenerate = arb.generate;
          arb.generate = (mrng: Random) => {
            const context = getDepthContextFor(identifier);
            context.depth = initial;
            try {
              const out = originalGenerate.call(arb, mrng);
              if (context.depth !== initial) {
                throw new Error('frequency did not reset the depth to its initial value');
              }
              return out;
            } finally {
              // We want to avoid breaking other tests due to this test
              // It uses a shared context that should be cleaned on exit (reset to 0)
              context.depth = 0;
            }
          };
        }
        return arb;
      },
      {
        seedGenerator,
        isValidValue: (v: number, metas: SeedGeneratorType) => {
          const constraints = metas.constraints || {};
          const { initial: initialDepth = 0 } = constraints.depthIdentifierMetas || {};
          // If maxDepth is <= initialDepth, then only the first arbitrary can be called
          if (constraints.maxDepth !== undefined && constraints.maxDepth <= initialDepth) {
            expect(canProduce(metas.data[0], v)).toBe(true);
          } else {
            expect(metas.data.some((m) => m.weight !== 0 && canProduce(m, v))).toBe(true);
          }
          return true;
        },
        isStrictlySmallerValue: (a: number, b: number, metas: SeedGeneratorType) => {
          // When withCrossShrink is toggled, the shrinker can jump from one arbitrary to the first one on shrink
          // But only if the weight associated to the first arbitrary is strictly greater than 0
          if (metas.constraints !== undefined && metas.constraints.withCrossShrink && metas.data[0].weight > 0) {
            const canBeInFirstArbitrary =
              metas.data[0].type === 'unique'
                ? metas.data[0].value === a
                : metas.data[0].value - 10 <= a && a <= metas.data[0].value;
            if (canBeInFirstArbitrary) {
              // `a` is possibly coming from our first arbitrary
              return true;
            }
          }
          // Otherwise, shrinks are always coming from the arbitrary itself
          return Math.abs(b - a) <= 10 && b > 0 ? b - a > 0 : b - a < 0;
        },
      }
    );
  });
});
