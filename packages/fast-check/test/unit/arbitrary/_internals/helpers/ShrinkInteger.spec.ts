import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { shrinkInteger } from '../../../../../src/arbitrary/_internals/helpers/ShrinkInteger';

describe('shrinkInteger', () => {
  it('should always return empty stream when current equals target', () =>
    fc.assert(
      fc.property(fc.maxSafeInteger(), fc.boolean(), (value, tryAsap) => {
        // Arrange / Act
        const shrinks = [...shrinkInteger(value, value, tryAsap)];

        // Assert
        expect(shrinks).toHaveLength(0);
      }),
    ));

  it('should always starts stream with target when try asap is requested (when current not target)', () =>
    fc.assert(
      fc.property(fc.maxSafeInteger(), fc.maxSafeInteger(), (current, target) => {
        // Arrange
        fc.pre(current !== target);

        // Act
        const shrinks = [...shrinkInteger(current, target, true)];

        // Assert
        expect(shrinks).not.toHaveLength(0);
        expect(shrinks[0].value).toBe(target);
        expect(shrinks[0].context).toBe(undefined);
      }),
    ));

  it('should only include values between current and target in the stream', () =>
    fc.assert(
      fc.property(fc.maxSafeInteger(), fc.maxSafeInteger(), fc.boolean(), (current, target, tryAsap) => {
        // Arrange / Act
        const shrinks = [...shrinkInteger(current, target, tryAsap)];
        const values = shrinks.map((v) => v.value);

        // Assert
        for (const v of values) {
          expect(v).toBeGreaterThanOrEqual(Math.min(current, target));
          expect(v).toBeLessThanOrEqual(Math.max(current, target));
        }
      }),
    ));

  it('should never include current in the stream', () =>
    fc.assert(
      fc.property(fc.maxSafeInteger(), fc.maxSafeInteger(), fc.boolean(), (current, target, tryAsap) => {
        // Arrange / Act
        const shrinks = [...shrinkInteger(current, target, tryAsap)];
        const values = shrinks.map((v) => v.value);

        // Assert
        expect(values).not.toContain(current);
      }),
    ));

  it('should never include target in the stream when try asap is not requested', () =>
    fc.assert(
      fc.property(fc.maxSafeInteger(), fc.maxSafeInteger(), (current, target) => {
        // Arrange / Act
        const shrinks = [...shrinkInteger(current, target, false)];
        const values = shrinks.map((v) => v.value);

        // Assert
        expect(values).not.toContain(target);
      }),
    ));

  it('should always set context to be the value of previous entry in the stream', () =>
    fc.assert(
      fc.property(fc.maxSafeInteger(), fc.maxSafeInteger(), fc.boolean(), (current, target, tryAsap) => {
        // Arrange / Act
        const shrinks = [...shrinkInteger(current, target, tryAsap)];

        // Assert
        for (let idx = 1; idx < shrinks.length; ++idx) {
          expect(shrinks[idx].context).toBe(shrinks[idx - 1].value);
        }
      }),
    ));

  it('should specify first context of the stream to target if and only if no try asap, undefined otherwise', () =>
    fc.assert(
      fc.property(fc.maxSafeInteger(), fc.maxSafeInteger(), fc.boolean(), (current, target, tryAsap) => {
        // Arrange
        const expectedFirstContext = tryAsap ? undefined : target;

        // Act
        const first = shrinkInteger(current, target, tryAsap).getNthOrLast(0);

        // Assert
        if (first !== null) {
          expect(first.context).toBe(expectedFirstContext);
        }
      }),
    ));

  it('should always strictly increase distance from target as we move in the stream', () =>
    fc.assert(
      fc.property(fc.maxSafeInteger(), fc.maxSafeInteger(), fc.boolean(), (current, target, tryAsap) => {
        // Arrange / Act
        const shrinks = [...shrinkInteger(current, target, tryAsap)];
        const absDiff = (a: number, b: number): bigint => {
          const result = BigInt(a) - BigInt(b);
          return result >= 0 ? result : -result;
        };

        // Assert
        for (let idx = 1; idx < shrinks.length; ++idx) {
          const previousDistance = absDiff(shrinks[idx - 1].value, target);
          const currentDistance = absDiff(shrinks[idx].value, target);
          expect(currentDistance).toBeGreaterThan(previousDistance);
        }
      }),
    ));
});
