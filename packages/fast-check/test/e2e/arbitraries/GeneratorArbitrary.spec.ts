import { describe, it, expect } from 'vitest';
import * as fc from '../../../src/fast-check.js';
import { seed } from '../seed.js';

describe(`GeneratorArbitrary (seed: ${seed})`, () => {
  it('should be able to shrink a single arbitrary', () => {
    const out = fc.check(
      fc.property(fc.gen(), (gen) => {
        const v1 = gen(fc.integer);
        expect(v1).toBeLessThanOrEqual(10);
      }),
      { seed: seed },
    );
    expect(out.failed).toBe(true);
    expect(out.counterexample![0].values()).toEqual([11]);
  });

  it('should be able to shrink two unrelated arbitraries', () => {
    const out = fc.check(
      fc.property(fc.gen(), (gen) => {
        const v1 = gen(fc.nat, {});
        const v2 = gen(fc.nat, {}); // unrelated because does not depend on v1
        expect(v1).toBeLessThanOrEqual(v2);
      }),
      { seed: seed },
    );
    expect(out.failed).toBe(true);
    expect(out.counterexample![0].values()).toEqual([1, 0]);
  });

  it('should be able to shrink two related arbitraries', () => {
    const squareArb = (size: number) => {
      const arb = fc.array(fc.array(fc.nat(), { minLength: size, maxLength: size }), {
        minLength: size,
        maxLength: size,
      });
      return arb;
    };
    const out = fc.check(
      fc.property(fc.gen(), (gen) => {
        const v1 = gen(fc.nat, { max: 100 });
        const v2 = gen(squareArb, v1);
        const surface = v2.length !== 0 ? v2.length * v2[0].length : 0;
        expect(surface).toBeLessThanOrEqual(8);
      }),
      { seed: seed },
    );
    expect(out.failed).toBe(true);
    expect(out.counterexample![0].values()).toEqual([
      3,
      [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
    ]);
  });

  it('should be able to shrink two related arbitraries with changing branches', () => {
    const out = fc.check(
      fc.property(fc.gen(), (gen) => {
        const v1 = gen(fc.integer);
        if (v1 < 0) {
          const v2 = gen(fc.integer);
          const v3 = gen(fc.integer);
          return typeof v2 === 'number' && typeof v3 === 'number'; // success
        }
        const v2 = gen(fc.string);
        expect(v2.length).toBeGreaterThanOrEqual(v1);
      }),
      { seed: seed },
    );
    expect(out.failed).toBe(true);
    expect(out.counterexample![0].values()).toEqual([1, '']);
  });

  it('should be able to shrink arbitraries generated via for-loops', () => {
    const out = fc.check(
      fc.property(fc.gen(), (gen) => {
        const width = gen(fc.nat, { max: 100 });
        const height = gen(fc.nat, { max: 100 });
        const grid: number[][] = [];
        for (let i = 0; i !== width; ++i) {
          const line: number[] = [];
          for (let j = 0; j !== height; ++j) {
            line.push(gen(fc.nat, { max: 100 }));
          }
          grid.push(line);
        }
        const allValues = grid.flat();
        const allValuesUnique = [...new Set(allValues)];
        expect(allValuesUnique).toEqual(allValues);
      }),
      { seed: seed },
    );
    expect(out.failed).toBe(true);
    const values = out.counterexample![0].values() as number[];
    expect(values).toHaveLength(4);
    expect(values[0] * values[1]).toBe(2);
    expect(values[3]).toBe(values[2]);
  });

  it('should be usable in conjonction with other arbitraries', () => {
    const out = fc.check(
      fc.property(fc.integer({ min: 0, max: 1000 }), fc.gen(), fc.integer({ min: 0, max: 1000 }), (a, gen, b) => {
        const min = Math.min(a, b);
        const max = Math.max(a, b);
        const value = gen(fc.integer, { min, max });
        expect(value).toBeGreaterThanOrEqual((min + max) / 2);
      }),
      { seed: seed },
    );
    expect(out.failed).toBe(true);
    const boundaryA = out.counterexample![0];
    const boundaryB = out.counterexample![2];
    const genValues = out.counterexample![1].values();
    expect(genValues).toHaveLength(1);
    const minBoundary = Math.min(boundaryA, boundaryB);
    const maxBoundary = Math.max(boundaryA, boundaryB);
    expect(genValues[0]).toBeGreaterThanOrEqual(minBoundary);
    expect(genValues[0]).toBeLessThanOrEqual(maxBoundary);
  });

  it('should be able to rely on cloneable arbitraries', () => {
    const out = fc.check(
      fc.property(fc.gen(), (gen) => {
        const context1 = gen(fc.context); // cloneable
        const intValueA = gen(fc.integer); // not cloneable
        const context2 = gen(fc.context); // cloneable
        const successFunction = gen(fc.compareBooleanFunc); // cloneable
        const intValueB = gen(fc.integer); // not cloneable
        context1.log(String(intValueA));
        context2.log(String(intValueB));
        return successFunction(intValueA, intValueB);
      }),
      { seed: seed },
    );
    expect(out.failed).toBe(true);
    const genValues = out.counterexample![0].values() as [
      fc.ContextValue,
      number,
      fc.ContextValue,
      (a: number, b: number) => boolean,
      number,
    ];
    expect(genValues[0].size()).toBe(1); // context1
    expect(genValues[2].size()).toBe(1); // context2
    expect(genValues[3](genValues[1], genValues[4])).toBe(false); // successFunction(intValueA, intValueB)
  });
});
