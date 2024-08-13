import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { shrinkBigInt } from '../../../../../src/arbitrary/_internals/helpers/ShrinkBigInt';

describe('shrinkBigInt', () => {
  it('should always return empty stream when current equals target', () =>
    fc.assert(
      fc.property(fc.bigInt(), fc.boolean(), (value, tryAsap) => {
        // Arrange / Act
        const shrinks = [...shrinkBigInt(value, value, tryAsap)];

        // Assert
        expect(shrinks).toHaveLength(0);
      }),
    ));

  it('should always starts stream with target when try asap is requested (when current not target)', () =>
    fc.assert(
      fc.property(fc.bigInt(), fc.bigInt(), (current, target) => {
        // Arrange
        fc.pre(current !== target);

        // Act
        const shrinks = [...shrinkBigInt(current, target, true)];

        // Assert
        expect(shrinks).not.toHaveLength(0);
        expect(shrinks[0].value).toBe(target);
        expect(shrinks[0].context).toBe(undefined);
      }),
    ));

  it('should only include values between current and target in the stream', () =>
    fc.assert(
      fc.property(fc.bigInt(), fc.bigInt(), fc.boolean(), (current, target, tryAsap) => {
        // Arrange / Act
        const shrinks = [...shrinkBigInt(current, target, tryAsap)];
        const values = shrinks.map((v) => v.value);
        const min = (a: bigint, b: bigint) => (a < b ? a : b);
        const max = (a: bigint, b: bigint) => (a < b ? b : a);

        // Assert
        for (const v of values) {
          expect(v).toBeGreaterThanOrEqual(min(current, target));
          expect(v).toBeLessThanOrEqual(max(current, target));
        }
      }),
    ));

  it('should never include current in the stream', () =>
    fc.assert(
      fc.property(fc.bigInt(), fc.bigInt(), fc.boolean(), (current, target, tryAsap) => {
        // Arrange / Act
        const shrinks = [...shrinkBigInt(current, target, tryAsap)];
        const values = shrinks.map((v) => v.value);

        // Assert
        expect(values).not.toContain(current);
      }),
    ));

  it('should never include target in the stream when try asap is not requested', () =>
    fc.assert(
      fc.property(fc.bigInt(), fc.bigInt(), (current, target) => {
        // Arrange / Act
        const shrinks = [...shrinkBigInt(current, target, false)];
        const values = shrinks.map((v) => v.value);

        // Assert
        expect(values).not.toContain(target);
      }),
    ));

  it('should always set context to be the value of previous entry in the stream', () =>
    fc.assert(
      fc.property(fc.bigInt(), fc.bigInt(), fc.boolean(), (current, target, tryAsap) => {
        // Arrange / Act
        const shrinks = [...shrinkBigInt(current, target, tryAsap)];

        // Assert
        for (let idx = 1; idx < shrinks.length; ++idx) {
          expect(shrinks[idx].context).toBe(shrinks[idx - 1].value);
        }
      }),
    ));

  it('should specify first context of the stream to target if and only if no try asap, undefined otherwise', () =>
    fc.assert(
      fc.property(fc.bigInt(), fc.bigInt(), fc.boolean(), (current, target, tryAsap) => {
        // Arrange
        const expectedFirstContext = tryAsap ? undefined : target;

        // Act
        const first = shrinkBigInt(current, target, tryAsap).getNthOrLast(0);

        // Assert
        if (first !== null) {
          expect(first.context).toBe(expectedFirstContext);
        }
      }),
    ));

  it('should always strictly increase distance from target as we move in the stream', () =>
    fc.assert(
      fc.property(fc.bigInt(), fc.bigInt(), fc.boolean(), (current, target, tryAsap) => {
        // Arrange / Act
        const shrinks = [...shrinkBigInt(current, target, tryAsap)];
        const absDiff = (a: bigint, b: bigint): bigint => {
          const result = a - b;
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
