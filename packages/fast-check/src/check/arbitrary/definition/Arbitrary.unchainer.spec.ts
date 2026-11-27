import { describe, it, expect, vi } from 'vitest';
import { xorshift128plus } from 'pure-rand/generator/xorshift128plus';
import { integer } from '../../../arbitrary/integer.js';
import { tuple } from '../../../arbitrary/tuple.js';
import { constant } from '../../../arbitrary/constant.js';
import { fakeArbitrary } from '../../../arbitrary/__test-helpers__/ArbitraryHelpers.js';
import { Random } from '../../../random/generator/Random.js';
import { check } from '../../runner/Runner.js';
import { asyncProperty } from '../../property/AsyncProperty.js';
import { Value } from './Value.js';

function recoverLimit(value: unknown): number {
  if (!Array.isArray(value) || value.length !== 2 || typeof value[0] !== 'number') {
    throw new Error('Expected a limit and a number');
  }
  return value[0];
}

describe('Arbitrary.chain with an unchainer', () => {
  it.each([
    { value: [7, 6], expected: true },
    { value: [0, 0], expected: true },
    { value: [11, 0], expected: false },
    { value: [7, 8], expected: false },
    { value: [7, '6'], expected: false },
    { value: null, expected: false },
  ])('should recognize $value as shrinkable: $expected', ({ value, expected }) => {
    const arb = integer({ min: 0, max: 10 }).chain(
      (limit) => tuple(constant(limit), integer({ min: 0, max: limit })),
      recoverLimit,
    );

    expect(arb.canShrinkWithoutContext(value)).toBe(expected);
  });

  it('should not call the chainer for an invalid recovered source', () => {
    const chainer = vi.fn(() => integer());
    const arb = integer({ min: 0, max: 10 }).chain(chainer, () => 11);

    expect(arb.canShrinkWithoutContext(5)).toBe(false);
    expect(chainer).not.toHaveBeenCalled();
  });

  it('should reject values when reconstructing the chained arbitrary throws', () => {
    const arb = integer().chain(
      () => {
        throw new Error('Unsupported source');
      },
      () => 5,
    );

    expect(arb.canShrinkWithoutContext(5)).toBe(false);
  });

  it('should preserve the reconstructed arbitrary and its shrink context', () => {
    const source = integer();
    const sourceShrink = vi.spyOn(source, 'shrink');
    const chained = fakeArbitrary<number>();
    const firstContext = Symbol('first');
    const nextContext = Symbol('next');
    chained.shrink.mockReturnValueOnce(Iterator.from([new Value(8, firstContext)]));
    chained.shrink.mockReturnValueOnce(Iterator.from([new Value(6, nextContext)]));
    const chainer = vi.fn(() => chained.instance);
    const unchainer = vi.fn(() => 5);
    const arb = source.chain(chainer, unchainer);

    const first = [...arb.shrink(10, undefined)][0];
    expect(first.value).toBe(8);
    const next = [...arb.shrink(first.value, first.context)][0];

    expect(next.value).toBe(6);
    expect(chained.shrink).toHaveBeenNthCalledWith(1, 10, undefined);
    expect(chained.shrink).toHaveBeenNthCalledWith(2, 8, firstContext);
    expect(unchainer).toHaveBeenCalledOnce();
    expect(chainer).toHaveBeenCalledOnce();
    expect(chainer).toHaveBeenCalledWith(5);
    expect(sourceShrink).not.toHaveBeenCalled();
    expect(chained.generate).not.toHaveBeenCalled();
  });

  it('should leave generated values and their shrinks unchanged', () => {
    const source = integer({ min: 0, max: 10 });
    const chainer = (limit: number) => tuple(constant(limit), integer({ min: 0, max: limit }));
    const unchainer = vi.fn(() => {
      throw new Error('Not used for generated values');
    });
    const original = source.chain(chainer);
    const withUnchainer = source.chain(chainer, unchainer);
    const originalValue = original.generate(new Random(xorshift128plus(42)), undefined);
    const withUnchainerValue = withUnchainer.generate(new Random(xorshift128plus(42)), undefined);

    expect(withUnchainerValue.value).toEqual(originalValue.value);
    expect([...withUnchainer.shrink(withUnchainerValue.value, withUnchainerValue.context)].map((v) => v.value)).toEqual(
      [...original.shrink(originalValue.value, originalValue.context)].map((v) => v.value),
    );
    expect(unchainer).not.toHaveBeenCalled();
  });

  it('should shrink a failing example within its recovered source', async () => {
    const arb = integer({ min: 0, max: 10 }).chain(
      (limit) => tuple(constant(limit), integer({ min: 0, max: limit })),
      recoverLimit,
    );
    const details = await check(
      asyncProperty(arb, () => false),
      { examples: [[[7, 6]]], numRuns: 1 },
    );

    expect(details.failed).toBe(true);
    expect(details.numShrinks).toBeGreaterThan(0);
    expect(details.counterexample).toEqual([[7, 0]]);
  });
});
