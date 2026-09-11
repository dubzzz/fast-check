import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import source from '../../../src/fast-check.js';
import type { Float16ArrayConstraints } from '../../../src/arbitrary/float16Array.js';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions.js';

it.skipIf(typeof Float16Array !== 'undefined')('should report missing Float16Array support when called', () => {
  expect(() => source.float16Array()).toThrow('fc.float16Array requires Float16Array support');
});

describe.skipIf(typeof Float16Array === 'undefined')('float16Array', () => {
  it.each([-Infinity, -65504, -1023.5, -(2 ** -14), -(2 ** -24), -0, 0, 2 ** -24, 2 ** -14, 1023.5, 65504, Infinity])(
    'should generate the exact binary16 boundary %s',
    (value) => {
      const arb = source.float16Array({ min: value, max: value, noNaN: true, minLength: 1, maxLength: 1 });
      expect(source.sample(arb, { seed: 42, numRuns: 5 }).every((array) => Object.is(array[0], value))).toBe(true);
    },
  );

  it.each<Float16ArrayConstraints>([
    {},
    { noNaN: true, noDefaultInfinity: true },
    { noInteger: true, noNaN: true },
    { min: -0, max: 0, noNaN: true },
  ])('should validate every native binary16 encoding for shrinking with %j', (constraints) => {
    const bits = new Uint16Array(1);
    const value = new Float16Array(bits.buffer);
    const arb = source.float16Array({ ...constraints, minLength: 1, maxLength: 1 });
    for (let encoding = 0; encoding <= 0xffff; ++encoding) {
      bits[0] = encoding;
      const element = value[0];
      const expected = Number.isNaN(element)
        ? !constraints.noNaN
        : (!constraints.noInteger || !Number.isInteger(element)) &&
          (!constraints.noDefaultInfinity || Number.isFinite(element)) &&
          (constraints.min === undefined || element >= constraints.min) &&
          (constraints.max === undefined || element <= constraints.max);
      expect(arb.canShrinkWithoutContext(value), `encoding: ${encoding}`).toBe(expected);
    }
  });

  it('should generate NaN and both infinities by default', () => {
    const values = source.sample(source.float16Array({ minLength: 1, maxLength: 1 }), { seed: 42, numRuns: 1000 });
    expect(values.some((array) => Number.isNaN(array[0]))).toBe(true);
    expect(values.some((array) => array[0] === Infinity)).toBe(true);
    expect(values.some((array) => array[0] === -Infinity)).toBe(true);
  });

  it.each(['min', 'max'] as const)('should reject non-binary16 %s constraints', (bound) => {
    for (const value of [NaN, 0.1, 2 ** -25, 65505]) {
      expect(() => source.float16Array({ [bound]: value })).toThrow(/16-bit float/);
    }
  });

  it.each([
    { min: 1, max: -1 },
    { min: 0, max: -0 },
    { min: 1, max: 1, minExcluded: true },
    { min: -Infinity, max: -65504, minExcluded: true, maxExcluded: true },
    { min: 1024, noInteger: true, noDefaultInfinity: true },
  ])('should reject empty ranges: %j', (constraints) => {
    expect(() => source.float16Array(constraints)).toThrow(/min must be smaller or equal/);
  });

  it('should distinguish inclusive and exclusive signed zero bounds', () => {
    const common = { min: -0, max: 0, noNaN: true, minLength: 1, maxLength: 1 };
    expect(
      source.sample(source.float16Array({ ...common, minExcluded: true }), 10).every((a) => Object.is(a[0], 0)),
    ).toBe(true);
    expect(
      source.sample(source.float16Array({ ...common, maxExcluded: true }), 10).every((a) => Object.is(a[0], -0)),
    ).toBe(true);
  });

  it('should reject values of another typed array type', () => {
    const arb = source.float16Array();
    expect(arb.canShrinkWithoutContext(new Float32Array([1]))).toBe(false);
    expect(arb.canShrinkWithoutContext([1])).toBe(false);
  });

  it.each([
    { constraints: { min: -0, max: 0, minExcluded: true }, rejected: -0 },
    { constraints: { min: -0, max: 0, maxExcluded: true }, rejected: 0 },
    { constraints: { min: 0, max: 1 }, rejected: 1 + 2 ** -10 },
    { constraints: { min: -1, max: 0 }, rejected: -1 - 2 ** -10 },
    { constraints: { max: Infinity, maxExcluded: true }, rejected: Infinity },
    { constraints: { min: -Infinity, minExcluded: true, max: -1 }, rejected: -Infinity },
    {
      constraints: { min: -(2 ** -10), max: 2 ** -10, maxExcluded: true, noInteger: true },
      rejected: 2 ** -10,
    },
    {
      constraints: { min: -(2 ** -10), minExcluded: true, max: -0, noInteger: true },
      rejected: -(2 ** -10),
    },
  ])('should reserve the NaN index for NaN and reject an excluded value: %j', ({ constraints, rejected }) => {
    const arb = source.float16Array({ ...constraints, minLength: 1, maxLength: 1 });
    expect(arb.canShrinkWithoutContext(Float16Array.of(NaN))).toBe(true);
    expect(arb.canShrinkWithoutContext(Float16Array.of(rejected))).toBe(false);
  });

  it('should reject a range containing only integers after excluding its bounds', () => {
    expect(() =>
      source.float16Array({
        min: -(2 ** -24),
        max: 2 ** -24,
        minExcluded: true,
        maxExcluded: true,
        noInteger: true,
        noNaN: true,
      }),
    ).toThrow(/min must be smaller or equal/);
  });

  it('should retain NaN when excluded bounds leave no non-integer number', () => {
    const arb = source.float16Array({
      min: -(2 ** -24),
      max: 2 ** -24,
      minExcluded: true,
      maxExcluded: true,
      noInteger: true,
      minLength: 1,
      maxLength: 1,
    });
    expect(source.sample(arb, { seed: 42, numRuns: 10 }).every((array) => Number.isNaN(array[0]))).toBe(true);
  });

  it.each([
    { min: 1024, max: Infinity },
    { min: 1023.5, minExcluded: true, max: Infinity },
    { min: Infinity, max: Infinity },
    { min: -Infinity, max: -1024 },
    { min: -Infinity, max: -1023.5, maxExcluded: true },
    { min: -Infinity, max: -Infinity },
  ])('should retain the only infinity in a non-integer range: %j', (constraints) => {
    const arb = source.float16Array({ ...constraints, noInteger: true, noNaN: true, minLength: 1, maxLength: 1 });
    const expected = constraints.max === Infinity ? Infinity : -Infinity;
    expect(source.sample(arb, { seed: 42, numRuns: 10 }).every((array) => array[0] === expected)).toBe(true);
    expect(arb.canShrinkWithoutContext(Float16Array.of(expected))).toBe(true);
  });

  it('should preserve constraints while shrinking examples without context', () => {
    const arb = source.float16Array({ min: 1, max: 2, noNaN: true, minLength: 1 });
    const shrinks = [...arb.shrink(Float16Array.from([1.5, 2]), undefined)];
    expect(shrinks.length).toBeGreaterThan(0);
    for (const shrink of shrinks) {
      expect(shrink.value).toBeInstanceOf(Float16Array);
      expect(shrink.value.length).toBeGreaterThanOrEqual(1);
      expect([...shrink.value].every((value) => value >= 1 && value <= 2)).toBe(true);
    }
  });
});

describe.skipIf(typeof Float16Array === 'undefined')('float16Array (integration)', () => {
  const half = fc.integer({ min: 0, max: 0xffff }).map((bits) => new Float16Array(Uint16Array.of(bits).buffer)[0]);
  const finiteHalf = half.filter(Number.isFinite);
  const extraParameters: fc.Arbitrary<Float16ArrayConstraints> = fc
    .record(
      {
        minLength: fc.nat({ max: 5 }),
        maxLength: fc.integer({ min: 5, max: 25 }),
        min: finiteHalf,
        max: finiteHalf,
        noDefaultInfinity: fc.boolean(),
        noNaN: fc.boolean(),
      },
      { requiredKeys: [] },
    )
    .map((constraints) => {
      if (
        constraints.min !== undefined &&
        constraints.max !== undefined &&
        (constraints.min > constraints.max || (Object.is(constraints.min, 0) && Object.is(constraints.max, -0)))
      ) {
        [constraints.min, constraints.max] = [constraints.max, constraints.min];
      }
      return constraints;
    });
  const builder = (constraints: Float16ArrayConstraints) => source.float16Array(constraints);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(builder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(
      builder,
      (value, constraints) => {
        expect(value).toBeInstanceOf(Float16Array);
        expect(value.length).toBeGreaterThanOrEqual(constraints.minLength ?? 0);
        expect(value.length).toBeLessThanOrEqual(constraints.maxLength ?? 0x7fffffff);
        for (const element of value) {
          if (Number.isNaN(element)) {
            expect(constraints.noNaN).not.toBe(true);
          } else {
            expect(element).toBeGreaterThanOrEqual(
              constraints.min ?? (constraints.noDefaultInfinity ? -65504 : -Infinity),
            );
            expect(element).toBeLessThanOrEqual(constraints.max ?? (constraints.noDefaultInfinity ? 65504 : Infinity));
          }
        }
      },
      { extraParameters },
    );
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(builder, { extraParameters });
  });

  it('should shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(builder, { extraParameters });
  });

  it('should exclude integers without losing infinities or non-integer boundaries', () => {
    const values = source
      .sample(source.float16Array({ noInteger: true, noNaN: true, minLength: 1 }), { seed: 42, numRuns: 1000 })
      .flatMap((a) => [...a]);
    expect(values.every((value) => !Number.isInteger(value))).toBe(true);
    for (const boundary of [-Infinity, -1023.5, 1023.5, Infinity]) {
      expect(values).toContain(boundary);
    }
  });
});
