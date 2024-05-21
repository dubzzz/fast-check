import { describe, it, expect } from 'vitest';
import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`RecursiveStructures (seed: ${seed})`, () => {
  // Test shrinking capabilities on very simple scenario:
  // >  The arbitrary used as base-case for the recursive structure is a constant.
  // >  It either pass or fail. But we ca never geenrate the wrong one and miss shrinking opportunities.

  it('Should shrink letrec/oneof towards the smallest case (on very simple scenario)', () => {
    // Arrange
    const failingLength = 2;
    const dataArb = fc.letrec((tie) => ({
      data: fc.oneof({ withCrossShrink: true }, fc.constant([0]), fc.tuple(tie('data'), tie('data'))),
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
      data: fc.option(fc.tuple(tie('data'), tie('data')), { nil: [0] }),
    })).data;

    // Act
    const out = fc.check(fc.property(dataArb, (data) => flat(data).length < failingLength));

    // Assert
    expect(out.failed).toBe(true);
    expect(flat(out.counterexample![0])).toHaveLength(failingLength);
  });

  it('Should shrink memo/oneof towards the smallest case (on very simple scenario)', () => {
    // Arrange
    const failingLength = 2;
    const dataArb: fc.Memo<readonly unknown[]> = fc.memo((n) => {
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
      else return fc.option(fc.tuple(dataArb(), dataArb()), { nil: [0], depthSize: 'small' });
    });

    // Act
    const out = fc.check(fc.property(dataArb(5), (data) => flat(data).length < failingLength));

    // Assert
    expect(out.failed).toBe(true);
    expect(flat(out.counterexample![0])).toHaveLength(failingLength);
  });

  it.each`
    baseSize
    ${'xsmall'}
    ${'small'}
    ${'medium'}
    ${'large'}
    ${'xlarge'}
  `(
    'Should be able to generate $baseSize simple recursive structures without reaching out-of-memory',
    ({ baseSize }) => {
      // Arrange
      const initialGlobal = fc.readConfigureGlobal();
      fc.configureGlobal({ ...initialGlobal, baseSize });
      try {
        const arb = fc.letrec((tie) => ({
          self: fc.oneof(fc.nat(), fc.record({ left: tie('self'), right: tie('self') })),
        })).self;

        // Act / Assert
        expect(() => fc.assert(fc.property(arb, () => true))).not.toThrow();
      } finally {
        fc.configureGlobal(initialGlobal);
      }
    },
  );

  it.each`
    baseSize
    ${'xsmall'}
    ${'small'}
    ${'medium'}
    ${'large'}
    ${'xlarge'}
  `(
    'Should be able to generate $baseSize array-based recursive structures without reaching out-of-memory',
    ({ baseSize }) => {
      // Arrange
      const initialGlobal = fc.readConfigureGlobal();
      fc.configureGlobal({ ...initialGlobal, baseSize });
      try {
        const depthIdentifier = fc.createDepthIdentifier();
        const arb = fc.letrec((tie) => ({
          self: fc.oneof({ depthIdentifier }, fc.nat(), fc.array(tie('self'), { depthIdentifier })),
        })).self;

        // Act / Assert
        expect(() => fc.assert(fc.property(arb, () => true))).not.toThrow();
      } finally {
        fc.configureGlobal(initialGlobal);
      }
    },
  );
});

// Helpers

function flat(arr: readonly unknown[]): unknown[] {
  return arr.reduce((acc: unknown[], cur: unknown) => {
    if (Array.isArray(cur)) acc.push(...flat(cur));
    else acc.push(cur);
    return acc;
  }, []);
}
