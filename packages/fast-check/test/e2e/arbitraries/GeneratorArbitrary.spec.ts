import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`GeneratorArbitrary (seed: ${seed})`, () => {
  it('should be able to shrink a single arbitrary', () => {
    const out = fc.check(
      fc.property(fc.__experimentalGen(), (gen) => {
        const v1 = gen(fc.integer);
        expect(v1).toBeLessThanOrEqual(10);
      }),
      { seed: seed }
    );
    expect(out.failed).toBe(true);
    expect(out.counterexample![0].values()).toEqual([11]);
  });

  it('should be able to shrink two unrelated arbitraries', () => {
    const out = fc.check(
      fc.property(fc.__experimentalGen(), (gen) => {
        const v1 = gen(fc.nat, {});
        const v2 = gen(fc.nat, {}); // unrelated because does not depend on v1
        expect(v1).toBeLessThanOrEqual(v2);
      }),
      { seed: seed }
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
      fc.property(fc.__experimentalGen(), (gen) => {
        const v1 = gen(fc.nat, { max: 100 });
        const v2 = gen(squareArb, v1);
        const surface = v2.length !== 0 ? v2.length * v2[0].length : 0;
        expect(surface).toBeLessThanOrEqual(8);
      }),
      { seed: seed }
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
      fc.property(fc.__experimentalGen(), (gen) => {
        const v1 = gen(fc.integer);
        if (v1 < 0) {
          const v2 = gen(fc.integer);
          const v3 = gen(fc.integer);
          return typeof v2 === 'number' && typeof v3 === 'number'; // success
        }
        const v2 = gen(fc.string);
        expect(v2.length).toBeGreaterThanOrEqual(v1);
      }),
      { seed: seed }
    );
    expect(out.failed).toBe(true);
    expect(out.counterexample![0].values()).toEqual([1, '']);
  });

  it('should be able to shrink arbitraries generated via for-loops', () => {
    const out = fc.check(
      fc.property(fc.__experimentalGen(), (gen) => {
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
      { seed: seed }
    );
    expect(out.failed).toBe(true);
    const values = out.counterexample![0].values() as number[];
    expect(values).toHaveLength(4);
    expect(values[0] * values[1]).toBe(2);
    expect(values[3]).toBe(values[2]);
  });
});
