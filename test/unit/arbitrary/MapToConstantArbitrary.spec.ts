import * as prand from 'pure-rand';
import * as fc from '../../../lib/fast-check';

import { mapToConstant } from '../../../src/arbitrary/mapToConstant';
import { Random } from '../../../src/random/generator/Random';
import { minMax } from '../check/arbitrary/generic/GenericArbitraryHelper';
import { nat } from '../../../src/arbitrary/nat';

describe('MapToConstantArbitrary', () => {
  describe('mapToConstant', () => {
    it('Single non-zero builder should be equivalent to nat and map', () =>
      fc.assert(
        fc.property(
          fc.integer(),
          fc.integer(1, Number.MAX_SAFE_INTEGER),
          minMax(fc.nat(100)),
          (seed, numValues, others) => {
            const { min: pos, max: numBuilders } = others;
            fc.pre(pos < numBuilders);

            const entries: { num: number; build: (v: number) => string }[] = [];
            for (let idx = 0; idx !== numBuilders; ++idx) {
              entries.push({ num: idx === pos ? numValues : 0, build: (v: number) => `Builder #${idx}: ${v}` });
            }

            const refArb = nat(numValues - 1).map((v) => entries[pos].build(v));
            const arb = mapToConstant(...entries);

            const refMrng = new Random(prand.xorshift128plus(seed));
            const mrng = new Random(prand.xorshift128plus(seed));

            expect(arb.generate(mrng).value).toEqual(refArb.generate(refMrng).value);
          }
        )
      ));
    it('Should call the right builder', () =>
      fc.assert(
        fc.property(fc.integer(), fc.array(fc.nat(100)), (seed, builderSizes) => {
          const totalSize = builderSizes.reduce((a, b) => a + b, 0);
          fc.pre(totalSize > 0);

          const entries: { num: number; build: (v: number) => any }[] = [];
          for (let idx = 0, currentSize = 0; idx !== builderSizes.length; currentSize += builderSizes[idx], ++idx) {
            entries.push({ num: builderSizes[idx], build: (v) => v + currentSize });
          }

          const refArb = nat(totalSize - 1);
          const arb = mapToConstant(...entries);

          const refMrng = new Random(prand.xorshift128plus(seed));
          const mrng = new Random(prand.xorshift128plus(seed));

          expect(arb.generate(mrng).value).toEqual(refArb.generate(refMrng).value);
        })
      ));
  });
});
