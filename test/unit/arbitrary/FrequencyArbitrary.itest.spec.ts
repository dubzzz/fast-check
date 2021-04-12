import * as fc from '../../../lib/fast-check';

import { frequency } from '../../../src/arbitrary/frequency';
import { integer } from '../../../src/arbitrary/integer';
import { constant } from '../../../src/check/arbitrary/ConstantArbitrary';

import * as genericHelper from '../check/arbitrary/generic/GenericArbitraryHelper';

import { mocked } from 'ts-jest/utils';
import * as DepthContextMock from '../../../src/arbitrary/_internals/helpers/DepthContext';
jest.mock('../../../src/arbitrary/_internals/helpers/DepthContext');

const depthContextData: Record<string, DepthContextMock.DepthContext> = {};

beforeEach(() => {
  // Cleaning between runs (WARNING: Doew not clean within properties themselves)
  for (const k in depthContextData) delete depthContextData[k];

  // Mocking
  const { getDepthContextFor } = mocked(DepthContextMock);
  getDepthContextFor.mockImplementation((key) => {
    if (key === undefined) return { depth: 0 };
    if (typeof key !== 'string') return key;
    if (!(key in depthContextData)) depthContextData[key] = { depth: 0 };
    return depthContextData[key];
  });
});

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
        if (metas.constraints.depthIdentifierMetas !== undefined) {
          // WARNING - This side-effect is not supposed to alter other tests but who knows!?
          const { identifier, initial } = metas.constraints.depthIdentifierMetas;
          depthContextData[identifier] = { depth: initial };
        }
        return frequency(sanitizedConstraints, ...arbs);
      },
      {
        seedGenerator,
        isValidValue: (v: number, metas: SeedGeneratorType) => {
          const constraints = metas.constraints || {};
          const { identifier, initial: initialDepth = 0 } = constraints.depthIdentifierMetas || {};
          // Check if depth has been reset after generate
          if (identifier !== undefined) {
            expect(depthContextData[identifier]).toEqual({ depth: initialDepth });
          }
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
