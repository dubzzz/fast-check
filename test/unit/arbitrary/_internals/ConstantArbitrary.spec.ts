import fc from '../../../../lib/fast-check';
import { ConstantArbitrary } from '../../../../src/arbitrary/_internals/ConstantArbitrary';
import { fakeRandom } from '../../check/arbitrary/generic/RandomHelpers';
import { cloneMethod } from '../../../../src/check/symbols';
import {
  assertGenerateProducesCorrectValues,
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesCorrectValues,
  assertShrinkProducesStrictlySmallerValue,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
} from '../../check/arbitrary/generic/NextArbitraryAssertions';
import { buildNextShrinkTree, walkTree } from '../../check/arbitrary/generic/ShrinkTree';

describe('ConstantArbitrary', () => {
  describe('generate', () => {
    it('should never call Random when provided a single value', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const value = Symbol();
      const { instance: mrng } = fakeRandom();

      // Act
      const arb = new ConstantArbitrary([value]);
      const g = arb.generate(mrng, expectedBiasFactor);

      // Assert
      expect(g.value).toEqual(value);
      expect(g.hasToBeCloned).toBe(false);
    });

    it('should call Random to generate any integer in [0, length-1] when provided multiple values', () =>
      fc.assert(
        fc.property(
          fc.array(fc.anything(), { minLength: 2 }),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.nat(),
          (values, biasFactor, mod) => {
            // Arrange
            const { instance: mrng, nextInt } = fakeRandom();
            nextInt.mockImplementation((a, b) => a + (mod % (b - a + 1)));

            // Act
            const arb = new ConstantArbitrary(values);
            const g = arb.generate(mrng, biasFactor);

            // Assert
            expect(nextInt).toHaveBeenCalledTimes(1);
            expect(nextInt).toHaveBeenCalledWith(0, values.length - 1);
            expect(values).toContainEqual(g.value);
          }
        )
      ));

    it('should be able to generate any of the requested values', () =>
      fc.assert(
        fc.property(
          fc.array(fc.anything(), { minLength: 2 }),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          fc.nat(),
          (values, biasFactor) => {
            // Arrange
            const { instance: mrng, nextInt } = fakeRandom();

            // Act / Assert
            const arb = new ConstantArbitrary(values);
            const notSeenValues = [...values];
            for (let idx = 0; idx !== values.length; ++idx) {
              nextInt.mockImplementationOnce((a, _b) => a + idx);
              const g = arb.generate(mrng, biasFactor);
              const index = notSeenValues.findIndex((v) => Object.is(g.value, v));
              expect(index).not.toBe(-1);
              notSeenValues.splice(index, 1);
            }
            expect(notSeenValues).toEqual([]);
          }
        )
      ));

    it('should produce a cloneable instance if provided value is cloneable', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const cloneable = Object.defineProperty([], cloneMethod, { value: jest.fn() });
      const { instance: mrng } = fakeRandom();

      // Act
      const arb = new ConstantArbitrary([cloneable]);
      const g = arb.generate(mrng, expectedBiasFactor);

      // Assert
      expect(g.hasToBeCloned).toBe(true);
    });

    it('should clone cloneable instances for each access', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const cloneMethodImpl = jest.fn();
      const cloneable = Object.defineProperty([], cloneMethod, { value: cloneMethodImpl });
      cloneMethodImpl.mockReturnValue(cloneable); // in reality it should be a clone of it, not itself
      const { instance: mrng } = fakeRandom();

      // Act
      const arb = new ConstantArbitrary([cloneable]);
      const g = arb.generate(mrng, expectedBiasFactor);
      expect(cloneMethodImpl).not.toHaveBeenCalled();

      // Assert
      g.value;
      expect(cloneMethodImpl).toHaveBeenCalledTimes(1);
      g.value;
      expect(cloneMethodImpl).toHaveBeenCalledTimes(2);
    });
  });

  describe('canShrinkWithoutContext', () => {
    it("should mark value as 'canShrinkWithoutContext' whenever one of the original values is equal regarding Object.is", () =>
      fc.assert(
        fc.property(fc.array(fc.anything(), { minLength: 1 }), fc.nat(), (values, mod) => {
          // Arrange
          const selectedValue = values[mod % values.length];

          // Act
          const arb = new ConstantArbitrary(values);
          const out = arb.canShrinkWithoutContext(selectedValue);

          // Assert
          expect(out).toBe(true);
        })
      ));

    it('should not detect values not equal regarding to Object.is', () => {
      // Arrange
      const values: unknown[] = [0, [], {}, ''];
      const selectedValue: unknown = [];

      // Act
      const arb = new ConstantArbitrary<unknown>(values);
      const out = arb.canShrinkWithoutContext(selectedValue);

      // Assert
      expect(out).toBe(false); // Object.is([], []) is falsy
    });
  });

  describe('shrink', () => {
    it('should shrink towards the first value if it was not already this one and to nil otherwise', () =>
      fc.assert(
        fc.property(fc.array(fc.anything(), { minLength: 1 }), fc.nat(), (values, mod) => {
          // Arrange
          const { instance: mrng, nextInt } = fakeRandom();
          nextInt.mockImplementation((a, b) => a + (mod % (b - a + 1)));

          // Act
          const arb = new ConstantArbitrary(values);
          const value = arb.generate(mrng, undefined);
          const shrinks = [...arb.shrink(value.value, value.context)];

          // Assert
          if (Object.is(value.value, values[0])) {
            expect(shrinks.map((v) => v.value)).toEqual([]);
          } else {
            expect(shrinks.map((v) => v.value)).toEqual([values[0]]);
          }
        })
      ));

    it('should shrink towards the first value if it was not already this one and to nil otherwise even without any context', () =>
      fc.assert(
        fc.property(fc.array(fc.anything(), { minLength: 1 }), fc.nat(), (values, mod) => {
          // Arrange
          const { instance: mrng, nextInt } = fakeRandom();
          nextInt.mockImplementation((a, b) => a + (mod % (b - a + 1)));

          // Act
          const arb = new ConstantArbitrary(values);
          const value = arb.generate(mrng, undefined);
          const shrinks = [...arb.shrink(value.value, undefined)];

          // Assert
          if (Object.is(value.value, values[0])) {
            expect(shrinks.map((v) => v.value)).toEqual([]);
          } else {
            expect(shrinks.map((v) => v.value)).toEqual([values[0]]);
          }
        })
      ));

    it('should not shrink towards the first value if generated value is equal to the first one regarding `Object.is`', () => {
      // Arrange
      const { instance: mrng, nextInt } = fakeRandom();

      // Act / Assert
      const arb = new ConstantArbitrary([Number.NaN, Number.NaN, Number.NaN]);
      for (let idx = 0; idx !== 3; ++idx) {
        nextInt.mockReturnValue(idx);
        const value = arb.generate(mrng, undefined);
        expect(value.value).toBe(Number.NaN);
        const shrinks = [...arb.shrink(value.value, value.context)];
        expect(shrinks).toHaveLength(0);
      }
    });
  });
});

describe('ConstantArbitrary (integration)', () => {
  type Extra = unknown[];
  const extraParameters: fc.Arbitrary<Extra> = fc.array(fc.anything(), { minLength: 1 });

  // In other words: extra.includes(value)                   --but with Object.is
  const isCorrect = (value: unknown, extra: Extra) => extra.findIndex((v) => Object.is(value, v)) !== -1;

  // In other words: extra.indexOf(v1) < extra.indexOf(v2)   --but with Object.is
  // If the same value has been declared twice in the `extra` once for `extra[0]` and the other for `extra[n]` (with n > 0)
  // Shrinker should never shrink `extra[n]` into `extra[0]` if they are equal regarding `Object.is`
  const isStrictlySmaller = (v1: unknown, v2: unknown, extra: Extra) =>
    extra.findIndex((v) => Object.is(v1, v)) < extra.findIndex((v) => Object.is(v2, v));

  const constantBuilder = (extra: Extra) => new ConstantArbitrary(extra);

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(constantBuilder, { extraParameters });
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(constantBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(constantBuilder, { extraParameters });
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(constantBuilder, { extraParameters });
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(constantBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(constantBuilder, { extraParameters });
  });

  it('should preserve strictly smaller ordering in shrink', () => {
    assertShrinkProducesStrictlySmallerValue(constantBuilder, isStrictlySmaller, { extraParameters });
  });

  it('should not re-use twice the same instance of cloneable', () => {
    // Arrange
    const alreadySeenCloneable = new Set<unknown>();
    const buildCloneable = (): unknown => {
      return Object.defineProperty([], cloneMethod, { value: buildCloneable });
    };
    const arb = new ConstantArbitrary([buildCloneable()]);
    const { instance: mrng } = fakeRandom();

    // Act
    const g = arb.generate(mrng, undefined);
    const treeA = buildNextShrinkTree(arb, g);
    const treeB = buildNextShrinkTree(arb, g);

    // Assert
    walkTree(treeA, (cloneable) => {
      expect(alreadySeenCloneable.has(cloneable)).toBe(false);
      alreadySeenCloneable.add(cloneable);
    });
    walkTree(treeB, (cloneable) => {
      expect(alreadySeenCloneable.has(cloneable)).toBe(false);
      alreadySeenCloneable.add(cloneable);
    });
  });
});
