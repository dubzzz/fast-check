import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`LetRecArbitrary (seed: ${seed})`, () => {
  describe('letrec', () => {
    it('Should be able to rebuild simple arbitraries', () => {
      const ref = fc.array(fc.tuple(fc.string(), fc.integer()));
      const { b } = fc.letrec((tie) => ({
        a: fc.integer(),
        b: fc.array(tie('c')),
        c: fc.tuple(tie('d'), tie('a')),
        d: fc.string(),
      }));
      expect(fc.sample(b, { seed })).toEqual(fc.sample(ref, { seed }));
    });
    it('Should be usable to build deep tree instances', () => {
      const { tree } = fc.letrec((tie) => ({
        tree: fc.frequency(
          // No depth factor for this test as we want to go as deep as possible.
          // While using a depth factor does not prevent such structure from being generated,
          // it may highly reduce their probability to be generated. So for the sake of this test,
          // we want to manually handle the depth via setting manually our weight so that the structure
          // will not explode and go too deep.
          { depthFactor: 0 },
          { arbitrary: tie('node'), weight: 45 },
          { arbitrary: tie('leaf'), weight: 55 }
        ),
        node: fc.tuple(tie('tree'), tie('tree')),
        leaf: fc.nat(),
      }));
      const out = fc.check(
        fc.property(tree, (t) => {
          const depth = (n: any): number => {
            if (typeof n === 'number') return 0;
            return 1 + Math.max(depth(n[0]), depth(n[1]));
          };
          return depth(t) < 5;
        }),
        { seed }
      );
      expect(out.failed).toBe(true); // depth can be greater or equal to 5
    });
    it('Should be able to shrink to smaller cases recursively', () => {
      const { tree } = fc.letrec((tie) => {
        return {
          tree: fc.nat(1).chain((id) => (id === 0 ? tie('leaf') : tie('node'))),
          node: fc.tuple(tie('tree'), tie('tree')),
          leaf: fc.nat(),
        };
      });
      const out = fc.check(
        fc.property(tree, (t) => typeof t !== 'object'),
        { seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0]).toEqual([0, 0]);
    });
  });
});
