import { describe, it, expect } from 'vitest';
import { derefPools, letrec } from '../../../src/arbitrary/letrec';
import { record } from '../../../src/arbitrary/record';
import { LazyArbitrary } from '../../../src/arbitrary/_internals/LazyArbitrary';
import { Value } from '../../../src/check/arbitrary/definition/Value';
import { Stream } from '../../../src/stream/Stream';
import { FakeIntegerArbitrary, fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';
import { fakeRandom } from './__test-helpers__/RandomHelpers';
import {
  assertGenerateEquivalentTo,
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions';

describe('letrec', () => {
  describe('builder', () => {
    it('should be able to construct independent arbitraries', () => {
      // Arrange
      const { instance: expectedArb1 } = fakeArbitrary();
      const { instance: expectedArb2 } = fakeArbitrary();

      // Act
      const { arb1, arb2 } = letrec((_tie) => ({
        arb1: expectedArb1,
        arb2: expectedArb2,
      }));

      // Assert
      expect(arb1).toBe(expectedArb1);
      expect(arb2).toBe(expectedArb2);
    });

    it('should be able to construct independent arbitraries with cycles', () => {
      // Arrange
      const expectedArb1 = new FakeIntegerArbitrary(1, 4);
      const expectedArb2 = new FakeIntegerArbitrary(6, 4);

      // Act
      const { arb1, arb2 } = letrec(
        (_tie) => ({
          arb1: expectedArb1,
          arb2: expectedArb2,
        }),
        { withCycles: true },
      );

      // Assert
      assertProduceCorrectValues(
        () => arb1,
        (value) => typeof value === 'number' && value >= 1 && value <= 5,
      );
      assertProduceCorrectValues(
        () => arb2,
        (value) => typeof value === 'number' && value >= 6 && value <= 10,
      );
    });

    it('should not produce LazyArbitrary for no-tie constructs', () => {
      // Arrange
      const { instance: expectedArb } = fakeArbitrary();

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
        const { instance: expectedArb, generate } = fakeArbitrary();
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

    it.each([false, true])('should be able to construct mutually recursive arbitraries', (withCycles) => {
      // Arrange / Act
      const { arb1, arb2 } = letrec(
        (tie) => ({
          arb1: tie('arb2'),
          arb2: tie('arb1'),
        }),
        { withCycles },
      );

      // Assert
      expect(arb1).toBeDefined();
      expect(arb2).toBeDefined();
    });

    it('should apply tie correctly', () => {
      // Arrange
      const { instance: expectedArb } = fakeArbitrary();

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

    it('should apply tie correctly with cycles', () => {
      // Arrange
      const expectedArb = new FakeIntegerArbitrary(1, 4);

      // Act
      const { arb1, arb2, arb3 } = letrec(
        (tie) => ({
          arb1: tie('arb2'),
          arb2: tie('arb3'),
          arb3: expectedArb,
        }),
        { withCycles: true },
      );

      // Assert
      assertProduceCorrectValues(
        () => arb1,
        (value) => typeof value === 'number' && value >= 1 && value <= 5,
      );
      assertProduceCorrectValues(
        () => arb2,
        (value) => typeof value === 'number' && value >= 1 && value <= 5,
      );
      assertProduceCorrectValues(
        () => arb3,
        (value) => typeof value === 'number' && value >= 1 && value <= 5,
      );
    });

    it('should apply tie the same way for a reversed declaration', () => {
      // Arrange
      const { instance: expectedArb } = fakeArbitrary();

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

  it('should apply tie the same way for a reversed declaration with cycles', () => {
    // Arrange
    const expectedArb = new FakeIntegerArbitrary(1, 4);

    // Act
    const { arb1, arb2, arb3 } = letrec(
      (tie) => ({
        // Same scenario as 'should apply tie correctly'
        // except we declared arb3 > arb2 > arb1
        // instead of arb1 > arb2 > arb3
        arb3: expectedArb,
        arb2: tie('arb3'),
        arb1: tie('arb2'),
      }),
      { withCycles: true },
    );

    // Assert
    assertProduceCorrectValues(
      () => arb1,
      (value) => typeof value === 'number' && value >= 1 && value <= 5,
    );
    assertProduceCorrectValues(
      () => arb2,
      (value) => typeof value === 'number' && value >= 1 && value <= 5,
    );
    assertProduceCorrectValues(
      () => arb3,
      (value) => typeof value === 'number' && value >= 1 && value <= 5,
    );
  });

  it.each([
    { key: 0, stringKey: '0' },
    { key: 1, stringKey: '1' },
    { key: 2147483647, stringKey: '2147483647' }, // max index for an array
    { key: 2147483648, stringKey: '2147483648' },
    { key: -1, stringKey: '-1' },
  ])('should be able to construct arbitraries referenced by the numeric key $key', ({ key, stringKey }) => {
    // Arrange
    const expectedArb = new FakeIntegerArbitrary(1, 4);

    // Act
    const { referenceToKey } = letrec((tie) => ({
      // built with a numeric key...
      [key]: expectedArb,
      // ...referenced by a string key (can't be referenced by the numeric key typing-wise)
      referenceToKey: tie(stringKey),
    }));

    // Assert
    assertProduceCorrectValues(
      () => referenceToKey,
      (value) => typeof value === 'number' && value >= 1 && value <= 5,
    );
  });

  describe('generate', () => {
    it('should be able to delay calls to tie to generate', () => {
      // Arrange
      const biasFactor = 69;
      const { instance: simpleArb, generate } = fakeArbitrary();
      generate.mockReturnValueOnce(new Value(null, undefined));
      const { instance: mrng } = fakeRandom();

      // Act
      const { arb1 } = letrec((tie) => {
        const { instance: simpleArb2, generate: generate2 } = fakeArbitrary();
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

    it.each([false, true])('should throw on generate if tie receives an invalid parameter', (withCycles) => {
      // Arrange
      const biasFactor = 42;
      const { arb1 } = letrec(
        (tie) => ({
          arb1: tie('missing'),
        }),
        { withCycles },
      );
      const { instance: mrng } = fakeRandom();

      // Act / Assert
      expect(() => arb1.generate(mrng, biasFactor)).toThrowError('Lazy arbitrary "missing" not correctly initialized');
    });

    it.each([false, true])(
      'should throw on generate if tie receives an invalid parameter after creation',
      (withCycles) => {
        // Arrange
        const biasFactor = 42;
        const { arb1 } = letrec(
          (tie) => {
            const { instance: simpleArb, generate } = fakeArbitrary();
            generate.mockImplementation((...args) => tie('missing').generate(...args));
            return {
              arb1: simpleArb,
            };
          },
          { withCycles },
        );
        const { instance: mrng } = fakeRandom();

        // Act / Assert
        expect(() => arb1.generate(mrng, biasFactor)).toThrowError(
          'Lazy arbitrary "missing" not correctly initialized',
        );
      },
    );

    it('should accept "reserved" keys as output of builder', () => {
      // Arrange
      const biasFactor = 42;
      const { instance: simpleArb, generate } = fakeArbitrary();
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
      const { instance: simpleArb, generate } = fakeArbitrary();
      generate.mockReturnValueOnce(new Value(null, undefined));
      const { a } = letrec<{ a: unknown }>((tie) =>
        Object.assign(Object.create(null), {
          a: tie('b'),
          b: simpleArb,
        }),
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
      const { instance: simpleArb, canShrinkWithoutContext } = fakeArbitrary();
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
        `[Error: Lazy arbitrary "missing" not correctly initialized]`,
      );
    });
  });

  describe('shrink', () => {
    it('should call shrink on the targets', () => {
      // Arrange
      const expectedValue = Symbol();
      const expectedContext = Symbol();
      const expectedStream = Stream.of(new Value(Symbol(), undefined));
      const { instance: simpleArb, shrink } = fakeArbitrary();
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
        `[Error: Lazy arbitrary "missing" not correctly initialized]`,
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

describe('letrec with cycles (integration)', () => {
  type Node = {
    value: number;
    next: Node;
  };
  const letrecBuilder = () => {
    const { node } = letrec<{ node: Node }>(
      (tie) => ({
        node: record({
          value: new FakeIntegerArbitrary(),
          next: tie('node'),
        }),
      }),
      { withCycles: true },
    );
    return node;
  };

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(letrecBuilder);
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(letrecBuilder, (node) => {
      let circular = false;
      const visited = new WeakSet();
      const assertNode = (node: Node) => {
        if (visited.has(node)) {
          circular = true;
          return;
        }
        visited.add(node);
        expect(typeof node.value).toBe('number');
        assertNode(node.next);
      };
      assertNode(node);
      // Must be circular because `next` isn't optional, so it has to circle
      // around eventually.
      expect(circular).toBe(true);
    });
  });
});

describe('derefPools', () => {
  const placeholderSymbol = Symbol('placeholder');

  it('pools without placeholders are not modified', () => {
    const pools = {
      a: [1, [2], 3],
      b: [[4], 5, { x: 6 }],
      c: [7, 8, { x: [{ y: 9 }] }],
    };
    const poolsCopy = structuredClone(pools);

    derefPools(pools, placeholderSymbol);

    expect(pools).toStrictEqual(poolsCopy);
  });

  it('pools have placeholders replaced', () => {
    const alreadyCircular: { x: unknown } = { x: null };
    alreadyCircular.x = alreadyCircular;
    const pools = {
      a: [
        1,
        // Mutual recursion.
        [[[[{ x: { [placeholderSymbol]: { key: 'a', index: 2 } } }]]]],
        { a: 'a', b: 'b', c: { [placeholderSymbol]: { key: 'a', index: 1 } } },
      ],
      b: [
        // Direct recursion.
        [[[[[['hello', { world: { [placeholderSymbol]: { key: 'b', index: 0 } } }]]]]]],
        // Recursive placeholder replacement.
        { value: { [placeholderSymbol]: { key: 'b', index: 2 } } },
        { [placeholderSymbol]: { key: 'b', index: 3 } },
        { [placeholderSymbol]: { key: 'b', index: 4 } },
        { value: 42 },
        // Cross pool mutual recursion.
        { values: [{ [placeholderSymbol]: { key: 'c', index: 0 } }] },
      ],
      c: [
        // Cross pool mutual recursion.
        { value: { [placeholderSymbol]: { key: 'b', index: 5 } } },
        alreadyCircular,
      ],
    };

    derefPools(pools, placeholderSymbol);

    // Mutual recursion.
    const xObject: { x: unknown } = { x: null };
    const aValue1 = [[[[xObject]]]];
    const aValue2 = { a: 'a', b: 'b', c: aValue1 };
    xObject.x = aValue2;
    // Direct recursion.
    const worldObject: { world: unknown } = { world: null };
    const bValue0 = [[[[[['hello', worldObject]]]]]];
    worldObject.world = bValue0;
    // Recursive placeholder replacement.
    const value42 = { value: 42 };
    // Cross pool mutual recursion.
    const bValue5 = { values: [] as unknown[] };
    const cValue0 = { value: bValue5 };
    bValue5.values.push(cValue0);

    expect(pools).toStrictEqual({
      a: [1, aValue1, aValue2],
      b: [bValue0, { value: value42 }, value42, value42, value42, bValue5],
      c: [cValue0, alreadyCircular],
    });
  });
});
