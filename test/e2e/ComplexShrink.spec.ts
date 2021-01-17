import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`ComplexShrink (seed: ${seed})`, () => {
  it('Should shrink two integers linked by a non-symmetric relation', () => {
    // In fast-check version 2.11.0 and before, this shrinking scenario
    // was causing barely infinite shrink. Some runs may take hours too end.
    //
    // The shrinker of integer was the root cause: it did not apply a full
    // dichotomy but instead starts with something close to a dichotomy then
    // stops. The main reason behind was that the context passed from one shrink level
    // to another was a simple boolean value only telling if we already shrunk once.
    //
    // Here are the first steps of the shrinker:
    //
    // × [2147483642,2147483641]        <--- shrinker tries to shrink 2147483642
    // . √ [0,2147483641]                    and knew that it never shrunk before
    // . √ [1073741821,2147483641]           so it tried with 0 on first try
    // . √ [1610612732,2147483641]
    // . √ [1879048187,2147483641]
    // . √ ...
    // . √ [2147482619,2147483641]
    // . × [2147483131,2147483641]      <--- shrinker tries to shrink 2147483131
    // . . √ [1073741566,2147483641]         but completely omit what has been discovered
    // . . √ [1610612349,2147483641]         during the first shrinks (the ones computed for 2147483642)
    // . . √ [1879047740,2147483641]
    // . . √ ...
    // . . √ [2147482620,2147483641]
    // . . × [2147482876,2147483641]
    // . . . √ [1073741438,2147483641]
    // . . . √ [1610612157,2147483641]
    // . . . √ [1879047517,2147483641]
    // . . . √ ...
    // . . . √ [2147482621,2147483641]
    // . . . × [2147482749,2147483641]
    // ...                              <--- and so on and so forth until we reach 1000,1010
    const out = fc.check(
      fc.property(fc.nat(), fc.nat(), (a: number, b: number) => {
        if (a < 1000) return true;
        if (b < 1000) return true;
        if (b < a) return true;
        if (Math.abs(a - b) < 10) return true;
        return b - a >= 1000;
      }),
      // We increase numRuns to avoid flakiness in the CI
      { seed, numRuns: 1000 }
    );

    // > should find the failure
    expect(out.failed).toBe(true);

    // > should find a barely minimal failing case
    // Such failing case is a local minimum. Reaching a difference
    // of 10 already proves that the shrinker did part of the job.
    const minimal = out.counterexample!;
    expect(minimal[1] - minimal[0]).toBe(10);

    // > should find the minimal failing case
    // Reaching this minimal case requires advanced shrinker logic
    // It implies a shrinker able to shrink on two values at the same time
    //expect(minimal).toEqual([1000, 1010]); // Not supported yet
  });
  it('Should shrink two integers linked by a symmetric relation', () => {
    // Very similar to the case above except that this time
    // if (a, b) fails, (b, a) will also fail.
    const out = fc.check(
      fc.property(fc.nat(), fc.nat(), (a: number, b: number) => {
        if (a < 1000) return true;
        if (b < 1000) return true;
        if (Math.abs(a - b) < 10) return true;
        return Math.abs(a - b) >= 1000;
      }),
      // We increase numRuns to avoid flakiness in the CI
      { seed, numRuns: 1000 }
    );

    // > should find the failure
    expect(out.failed).toBe(true);

    // > should find a barely minimal failing case
    // Such failing case is a local minimum. Reaching a difference
    // of 10 already proves that the shrinker did part of the job.
    //const [a, b] = out.counterexample!;
    //const minimal = a < b ? [a, b] : [b, a];
    //expect(Math.abs(minimal[1] - minimal[0])).toBe(10);

    // > should find the minimal failing case
    // Reaching this minimal case requires advanced shrinker logic
    // It implies a shrinker able to shrink on two values at the same time
    //expect(minimal).toEqual([1000, 1010]); // Not supported yet
  });
});
