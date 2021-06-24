import { sparseArray, SparseArrayConstraints } from '../../../src/arbitrary/sparseArray';
import { nat } from '../../../src/arbitrary/nat';
import * as genericHelper from '../check/arbitrary/generic/GenericArbitraryHelper';
import fc from '../../../lib/fast-check';

const validSparseArrayConstraints = () =>
  fc
    .record(
      {
        maxLength: fc.nat(100), // Even if full of holes, they still are memory intensive
        minNumElements: fc.nat(100), // we explicitely limit num elements in order
        maxNumElements: fc.nat(100), // to avoid running our tests for too long
        noTrailingHole: fc.boolean(),
      },
      { requiredKeys: [] }
    )
    .map((ct) => {
      // We use map there in order not to filter on generated values
      if (ct.minNumElements !== undefined && ct.maxNumElements !== undefined && ct.minNumElements > ct.maxNumElements) {
        return { ...ct, minNumElements: ct.maxNumElements, maxNumElements: ct.minNumElements };
      }
      return ct;
    })
    .map((ct) => {
      // We use map there in order not to filter on generated values
      if (ct.minNumElements !== undefined && ct.maxLength !== undefined && ct.minNumElements > ct.maxLength) {
        return { ...ct, minNumElements: ct.maxLength, maxLength: ct.minNumElements };
      }
      return ct;
    });

describe('SparseArrayArbitrary', () => {
  describe('sparseArray', () => {
    genericHelper.isValidArbitrary((ct: SparseArrayConstraints | undefined) => sparseArray(nat(), ct), {
      seedGenerator: fc.option(validSparseArrayConstraints(), { nil: undefined }),
      isEqual: (g1, g2) => {
        // WARNING: Very long loops in Jest when comparing two very large sparse arrays
        expect(g1.length).toBe(g2.length);
        expect(Object.keys(g1)).toEqual(Object.keys(g2));
        return true;
      },
      isValidValue: (g, ct: SparseArrayConstraints = {}) => {
        // Should be an array
        if (!Array.isArray(g)) return false;
        // Should not have a length greater than the requested one (if any)
        if (ct.maxLength !== undefined && g.length > ct.maxLength) return false;
        // Should contain at least the minimal number of requested items (if specified)
        if (ct.minNumElements !== undefined && Object.keys(g).length < ct.minNumElements) return false;
        // Should contain at most the maxiaml number of requested items (if specified)
        if (ct.maxNumElements !== undefined && Object.keys(g).length > ct.maxNumElements) return false;
        // Should only contain valid keys: numbers within 0 and length-1
        for (const k of Object.keys(g)) {
          const i = Number(k);
          if (Number.isNaN(i) || i < 0 || i >= g.length) return false;
        }
        // Should never end by a hole if user activated noTrailingHole
        if (ct.noTrailingHole && g.length > 0 && !(g.length - 1 in g)) return false;
        // If all the previous checks passed, then array should be ok
        return true;
      },
    });
  });
});
