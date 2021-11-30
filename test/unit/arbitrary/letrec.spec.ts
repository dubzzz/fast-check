import { letrec } from '../../../src/arbitrary/letrec';
import { LazyArbitrary } from '../../../src/arbitrary/_internals/LazyArbitrary';
import { Value } from '../../../src/check/arbitrary/definition/Value';
import { Stream } from '../../../src/stream/Stream';
import { FakeIntegerArbitrary, fakeNextArbitrary } from './__test-helpers__/NextArbitraryHelpers';
import { fakeRandom } from './__test-helpers__/RandomHelpers';
import {
  assertGenerateEquivalentTo,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/NextArbitraryAssertions';

describe('letrec', () => {
  describe('builder', () => {
    it('should be able to construct independant arbitraries', () => {
      // Arrange
      const { instance: expectedArb1 } = fakeNextArbitrary();
      const { instance: expectedArb2 } = fakeNextArbitrary();

      // Act
      const { arb1, arb2 } = letrec((_tie) => ({
        arb1: expectedArb1,
        arb2: expectedArb2,
      }));

      // Assert
      expect(arb1).toBe(expectedArb1);
      expect(arb2).toBe(expectedArb2);
    });

    it('should not produce LazyArbitrary for no-tie constructs', () => {
      // Arrange
      const { instance: expectedArb } = fakeNextArbitrary();

      // Act
      const { arb } = letrec((_tie) => ({
        arb: expectedArb,
      }));

      // Assert
      expect(arb).not.toBeInstanceOf(LazyArbitrary);
      expect(arb).toBe(expectedArb);
    });

    it('should not produce LazyArbitrary for indirect tie constructs', () => {
      // Arrange / Act
      const { arb } = letrec((tie) => {
        const { instance: expectedArb, generate } = fakeNextArbitrary();
        generate.mockImplementation((...args) => tie('arb').generate(...args));
        return {
          // arb is an arbitrary wrapping the tie value (as fc.array)
          arb: expectedArb,
        };
      });

      // Assert
      expect(arb).not.toBeInstanceOf(LazyArbitrary);
    });

    it('should produce LazyArbitrary for direct tie constructs', () => {
      // Arrange / Act
      const { arb } = letrec((tie) => ({
        arb: tie('arb'),
      }));

      // Assert
      expect(arb).toBeInstanceOf(LazyArbitrary);
    });

    it('should be able to construct mutually recursive arbitraries', () => {
      // Arrange / Act
      const { arb1, arb2 } = letrec((tie) => ({
        arb1: tie('arb2'),
        arb2: tie('arb1'),
      }));

      // Assert
      expect(arb1).toBeDefined();
      expect(arb2).toBeDefined();
    });

    it('should apply tie correctly', () => {
      // Arrange
      const { instance: expectedArb } = fakeNextArbitrary();

      // Act
      const { arb1, arb2, arb3 } = letrec((tie) => ({
        arb1: tie('arb2'),
        arb2: tie('arb3'),
        arb3: expectedArb,
      }));

      // Assert
      expect(arb1).toBeInstanceOf(LazyArbitrary);
      expect(arb2).toBeInstanceOf(LazyArbitrary);
      expect(arb3).not.toBeInstanceOf(LazyArbitrary);
      expect((arb1 as any as LazyArbitrary<unknown>).underlying).toBe(arb2);
      expect((arb2 as any as LazyArbitrary<unknown>).underlying).toBe(arb3);
      expect(arb3).toBe(expectedArb);
    });

    it('should apply tie the same way for a reversed declaration', () => {
      // Arrange
      const { instance: expectedArb } = fakeNextArbitrary();

      // Act
      const { arb1, arb2, arb3 } = letrec((tie) => ({
        // Same scenario as 'should apply tie correctly'
        // except we declared arb3 > arb2 > arb1
        // instead of arb1 > arb2 > arb3
        arb3: expectedArb,
        arb2: tie('arb3'),
        arb1: tie('arb2'),
      }));

      // Assert
      expect(arb1).toBeInstanceOf(LazyArbitrary);
      expect(arb2).toBeInstanceOf(LazyArbitrary);
      expect(arb3).not.toBeInstanceOf(LazyArbitrary);
      expect((arb1 as any as LazyArbitrary<unknown>).underlying).toBe(arb2);
      expect((arb2 as any as LazyArbitrary<unknown>).underlying).toBe(arb3);
      expect(arb3).toBe(expectedArb);
    });
  });

  describe('generate', () => {
    it('should be able to delay calls to tie to generate', () => {
      // Arrange
      const biasFactor = 69;
      const { instance: simpleArb, generate } = fakeNextArbitrary();
      generate.mockReturnValueOnce(new Value(null, undefined));
      const { instance: mrng } = fakeRandom();

      // Act
      const { arb1 } = letrec((tie) => {
        const { instance: simpleArb2, generate: generate2 } = fakeNextArbitrary();
        generate2.mockImplementation((...args) => tie('arb2').generate(...args));
        return {
          arb1: simpleArb2,
          arb2: simpleArb,
        };
      });
      expect(generate).not.toHaveBeenCalled();
      arb1.generate(mrng, biasFactor);

      // Assert
      expect(generate).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledWith(mrng, biasFactor);
    });

    it('should throw on generate if tie receives an invalid parameter', () => {
      // Arrange
      const biasFactor = 42;
      const { arb1 } = letrec((tie) => ({
        arb1: tie('missing'),
      }));
      const { instance: mrng } = fakeRandom();

      // Act / Assert
      expect(() => arb1.generate(mrng, biasFactor)).toThrowErrorMatchingInlineSnapshot(
        `"Lazy arbitrary \\"missing\\" not correctly initialized"`
      );
    });

    it('should throw on generate if tie receives an invalid parameter after creation', () => {
      // Arrange
      const biasFactor = 42;
      const { arb1 } = letrec((tie) => {
        const { instance: simpleArb, generate } = fakeNextArbitrary();
        generate.mockImplementation((...args) => tie('missing').generate(...args));
        return {
          arb1: simpleArb,
        };
      });
      const { instance: mrng } = fakeRandom();

      // Act / Assert
      expect(() => arb1.generate(mrng, biasFactor)).toThrowErrorMatchingInlineSnapshot(
        `"Lazy arbitrary \\"missing\\" not correctly initialized"`
      );
    });

    it('should accept "reserved" keys as output of builder', () => {
      // Arrange
      const biasFactor = 42;
      const { instance: simpleArb, generate } = fakeNextArbitrary();
      generate.mockReturnValueOnce(new Value(null, undefined));
      const { tie } = letrec((tie) => ({
        tie: tie('__proto__'),
        ['__proto__']: tie('__defineGetter__​​'),
        ['__defineGetter__​​']: tie('__defineSetter__​​'),
        ['__defineSetter__​​']: tie('__lookupGetter__​​'),
        ['__lookupGetter__​​']: tie('__lookupSetter__​​'),
        ['__lookupSetter__​​']: tie('constructor​​'),
        ['constructor​​']: tie('hasOwnProperty​​'),
        ['hasOwnProperty​​']: tie('isPrototypeOf​​'),
        ['isPrototypeOf​​']: tie('propertyIsEnumerable​​'),
        ['propertyIsEnumerable​​']: tie('toLocaleString​​'),
        ['toLocaleString​​']: tie('toSource​​'),
        ['toSource​​']: tie('toString​​'),
        ['toString​​']: tie('valueOf'),
        ['valueOf']: simpleArb,
      }));
      const { instance: mrng } = fakeRandom();

      // Act
      expect(generate).not.toHaveBeenCalled();
      tie.generate(mrng, biasFactor);

      // Assert
      expect(generate).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledWith(mrng, biasFactor);
    });

    it('should accept builders producing objects based on Object.create(null)', () => {
      // Arrange
      const biasFactor = 42;
      const { instance: simpleArb, generate } = fakeNextArbitrary();
      generate.mockReturnValueOnce(new Value(null, undefined));
      const { a } = letrec((tie) =>
        Object.assign(Object.create(null), {
          a: tie('b'),
          b: simpleArb,
        })
      );
      const { instance: mrng } = fakeRandom();

      // Act
      expect(generate).not.toHaveBeenCalled();
      a.generate(mrng, biasFactor);

      // Assert
      expect(generate).toHaveBeenCalledTimes(1);
      expect(generate).toHaveBeenCalledWith(mrng, biasFactor);
    });
  });

  describe('canShrinkWithoutContext', () => {
    it.each`
      expectedStatus
      ${false}
      ${true}
    `('should call canShrinkWithoutContext on the targets', ({ expectedStatus }) => {
      // Arrange
      const expectedValue = Symbol();
      const { instance: simpleArb, canShrinkWithoutContext } = fakeNextArbitrary();
      canShrinkWithoutContext.mockReturnValueOnce(expectedStatus);
      const { arb1 } = letrec((tie) => {
        return {
          arb1: tie('arb2'),
          arb2: simpleArb,
        };
      });

      // Act
      const out = arb1.canShrinkWithoutContext(expectedValue);

      // Assert
      expect(canShrinkWithoutContext).toHaveBeenCalledTimes(1);
      expect(canShrinkWithoutContext).toHaveBeenCalledWith(expectedValue);
      expect(out).toBe(expectedStatus);
    });

    it('should throw on canShrinkWithoutContext if tie receives an invalid parameter', () => {
      // Arrange
      const expectedValue = Symbol();
      const { arb1 } = letrec((tie) => ({
        arb1: tie('missing'),
      }));

      // Act / Assert
      expect(() => arb1.canShrinkWithoutContext(expectedValue)).toThrowErrorMatchingInlineSnapshot(
        `"Lazy arbitrary \\"missing\\" not correctly initialized"`
      );
    });
  });

  describe('shrink', () => {
    it('should call shrink on the targets', () => {
      // Arrange
      const expectedValue = Symbol();
      const expectedContext = Symbol();
      const expectedStream = Stream.of(new Value(Symbol(), undefined));
      const { instance: simpleArb, shrink } = fakeNextArbitrary();
      shrink.mockReturnValueOnce(expectedStream);
      const { arb1 } = letrec((tie) => {
        return {
          arb1: tie('arb2'),
          arb2: simpleArb,
        };
      });

      // Act
      const out = arb1.shrink(expectedValue, expectedContext);

      // Assert
      expect(shrink).toHaveBeenCalledTimes(1);
      expect(shrink).toHaveBeenCalledWith(expectedValue, expectedContext);
      expect(out).toBe(expectedStream);
    });

    it('should throw on shrink if tie receives an invalid parameter', () => {
      // Arrange
      const expectedValue = Symbol();
      const expectedContext = Symbol();
      const { arb1 } = letrec((tie) => ({
        arb1: tie('missing'),
      }));

      // Act / Assert
      expect(() => arb1.shrink(expectedValue, expectedContext)).toThrowErrorMatchingInlineSnapshot(
        `"Lazy arbitrary \\"missing\\" not correctly initialized"`
      );
    });
  });
});

describe('letrec (integration)', () => {
  const letrecBuilder = () => {
    const { a } = letrec((tie) => ({
      a: tie('b'),
      b: tie('c'),
      c: new FakeIntegerArbitrary(),
    }));
    return a;
  };

  it('should generate the values as-if we directly called the target arbitrary', () => {
    assertGenerateEquivalentTo(letrecBuilder, () => new FakeIntegerArbitrary(), {
      isEqualContext: (c1, c2) => {
        expect(c2).toEqual(c1);
      },
    });
  });

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(letrecBuilder);
  });

  it('should produce values seen as shrinkable without any context (if underlyings do)', () => {
    assertProduceValuesShrinkableWithoutContext(letrecBuilder);
  });

  it('should be able to shrink to the same values without initial context (if underlyings do)', () => {
    assertShrinkProducesSameValueWithoutInitialContext(letrecBuilder);
  });
});
