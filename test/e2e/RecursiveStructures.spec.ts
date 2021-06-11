import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`RecursiveStructures (seed: ${seed})`, () => {
  // Test shrinking capabilities on very simple scenario:
  // >  The arbitrary used as base-case for the recursive structure is a constant.
  // >  It either pass or fail. But we ca never geenrate the wrong one and miss shrinking opportunities.

  it('Should shrink letrec/frequency towards the smallest case (on very simple scenario)', () => {
    // Arrange
    const failingLength = 2;
    const dataArb = fc.letrec((tie) => ({
      data: fc.frequency(
        { withCrossShrink: true, depthFactor: 0.5 },
        { arbitrary: fc.constant([0]), weight: 1 },
        { arbitrary: fc.tuple(tie('data'), tie('data')), weight: 1 }
      ),
    })).data;

    // Act
    const out = fc.check(fc.property(dataArb, (data) => flat(data).length < failingLength));

    // Assert
    expect(out.failed).toBe(true);
    expect(flat(out.counterexample![0])).toHaveLength(failingLength);
  });

  it('Should shrink letrec/oneof towards the smallest case (on very simple scenario)', () => {
    // Arrange
    const failingLength = 2;
    const dataArb = fc.letrec((tie) => ({
      data: fc.oneof({ withCrossShrink: true, depthFactor: 0.5 }, fc.constant([0]), fc.tuple(tie('data'), tie('data'))),
    })).data;

    // Act
    const out = fc.check(fc.property(dataArb, (data) => flat(data).length < failingLength));

    // Assert
    expect(out.failed).toBe(true);
    expect(flat(out.counterexample![0])).toHaveLength(failingLength);
  });

  it('Should shrink letrec/option towards the smallest case (on very simple scenario)', () => {
    // Arrange
    const failingLength = 2;
    const dataArb = fc.letrec((tie) => ({
      data: fc.option(fc.tuple(tie('data'), tie('data')), { nil: [0], depthFactor: 0.5 }),
    })).data;

    // Act
    const out = fc.check(fc.property(dataArb, (data) => flat(data).length < failingLength));

    // Assert
    expect(out.failed).toBe(true);
    expect(flat(out.counterexample![0])).toHaveLength(failingLength);
  });

  it('Should shrink memo/frequency towards the smallest case (on very simple scenario)', () => {
    // Arrange
    const failingLength = 2;
    const dataArb: fc.Memo<unknown[]> = fc.memo((n) => {
      if (n <= 1) return fc.constant([0]);
      else
        return fc.frequency(
          { withCrossShrink: true },
          { arbitrary: fc.constant([0]), weight: 1 },
          { arbitrary: fc.tuple(dataArb(), dataArb()), weight: 1 }
        );
    });

    // Act
    const out = fc.check(fc.property(dataArb(5), (data) => flat(data).length < failingLength));

    // Assert
    expect(out.failed).toBe(true);
    expect(flat(out.counterexample![0])).toHaveLength(failingLength);
  });

  it('Should shrink memo/oneof towards the smallest case (on very simple scenario)', () => {
    // Arrange
    const failingLength = 2;
    const dataArb: fc.Memo<unknown[]> = fc.memo((n) => {
      if (n <= 1) return fc.constant([0]);
      else return fc.oneof({ withCrossShrink: true }, fc.constant([0]), fc.tuple(dataArb(), dataArb()));
    });

    // Act
    const out = fc.check(fc.property(dataArb(5), (data) => flat(data).length < failingLength));

    // Assert
    expect(out.failed).toBe(true);
    expect(flat(out.counterexample![0])).toHaveLength(failingLength);
  });

  it('Should shrink memo/option towards the smallest case (on very simple scenario)', () => {
    // Arrange
    const failingLength = 2;
    const dataArb: fc.Memo<unknown[]> = fc.memo((n) => {
      if (n <= 1) return fc.constant([0]);
      else return fc.option(fc.tuple(dataArb(), dataArb()), { nil: [0], depthFactor: 0.5 });
    });

    // Act
    const out = fc.check(fc.property(dataArb(5), (data) => flat(data).length < failingLength));

    // Assert
    expect(out.failed).toBe(true);
    expect(flat(out.counterexample![0])).toHaveLength(failingLength);
  });
});

// Helpers

function flat(arr: unknown[]): unknown[] {
  return arr.reduce((acc: unknown[], cur: unknown) => {
    if (Array.isArray(cur)) acc.push(...flat(cur));
    else acc.push(cur);
    return acc;
  }, []);
}
