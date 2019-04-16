import fc from '../../../../../lib/fast-check';

import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';
import { ArbitraryBuilder, TestSuiteSettings, buildEq, buildNotEq, buildCmp } from './helpers/TestSuiteSettings';
import { traverseShrink1, traverseShrink2, TestSettings } from './helpers/TraverseShrink';

class ArbitraryTestSuite<T, U> {
  private readonly arbitraryBuilder: ArbitraryBuilder<T, U>;
  private readonly equality?: (a: T, b: T) => boolean | void;

  private static isArbitraryBuilder<T, U>(
    arbitrary: ArbitraryBuilder<T, U> | Arbitrary<T>
  ): arbitrary is ArbitraryBuilder<T, U> {
    return (arbitrary as any).builder !== undefined && (arbitrary as any).seed !== undefined;
  }
  private static extractBuilder<T, U>(settings: TestSuiteSettings<T, U>): ArbitraryBuilder<T, U> {
    const { arbitrary } = settings;
    if (ArbitraryTestSuite.isArbitraryBuilder(arbitrary)) return arbitrary;
    return (({
      builder: () => arbitrary,
      seed: fc.constant(null)
    } as ArbitraryBuilder<T, any>) as any) as ArbitraryBuilder<T, U>;
  }

  constructor(suiteSettings: TestSuiteSettings<T, U>) {
    this.arbitraryBuilder = ArbitraryTestSuite.extractBuilder(suiteSettings);
    this.equality = suiteSettings.equal;
  }

  /**
   * RECOMMENDED -
   * Assess an arbitrary is fully reproducible
   *
   * Check both the generation and the shrinking
   */
  isReproducible(testSettings?: TestSettings<U>): ArbitraryTestSuite<T, U> {
    it('Should be reproducible [isReproducible]', () => {
      const eq = buildEq(this.equality);
      traverseShrink2(
        this.arbitraryBuilder.seed,
        [this.arbitraryBuilder.builder, this.arbitraryBuilder.builder],
        () => {},
        ([v1, v2]: [T, T]) => eq(v1, v2),
        testSettings
      );
    });
    return this;
  }

  /**
   * RECOMMENDED -
   * Assess shrink path is finite
   * and cannot go into an infinite loop
   *
   * Shrink path is not producing shrank values from which it shrank
   */
  isNoInfiniteShrink(testSettings?: TestSettings<U>): ArbitraryTestSuite<T, U> {
    it('Should not loop in shrink [isNoInfiniteShrink]', () => {
      const neq = buildNotEq(this.equality);
      let shrinkHistory: T[] = [];
      traverseShrink1(
        this.arbitraryBuilder.seed,
        [this.arbitraryBuilder.builder],
        () => {
          shrinkHistory = [];
        },
        ([t]: [T]) => {
          // Have we seen the value before?
          shrinkHistory.forEach(v => neq(v, t)); // throw if so
          shrinkHistory.push(t);
        },
        testSettings
      );
    });
    return this;
  }

  /**
   * Assess shrink path is strictly decreasing
   */
  isAlwaysLowerThanShrink(
    lowerThan: (a: T, b: T) => boolean | void,
    testSettings?: TestSettings<U>
  ): ArbitraryTestSuite<T, U> {
    it('Should strictly decrease during shrink [isAlwaysLowerThanShrink]', () => {
      const lt = buildCmp(lowerThan, 'strictly lower');
      let lastSeenValue: { value: T } | null = null;
      traverseShrink1(
        this.arbitraryBuilder.seed,
        [this.arbitraryBuilder.builder],
        () => {
          lastSeenValue = null;
        },
        ([t]: [T]) => {
          // Strictly lower than the last one
          if (lastSeenValue !== null) lt(t, lastSeenValue.value);
          lastSeenValue = { value: t };
        },
        testSettings
      );
    });
    return this;
  }

  /**
   * Assess both generation and shrink produce valid values
   */
  isValid(validValue: (t: T, u: U) => boolean | void, testSettings?: TestSettings<U>): ArbitraryTestSuite<T, U> {
    it('Should only produce valid values [isValid]', () => {
      const valid = (t: T, u: U) => {
        if (!validValue(t, u)) throw new Error(`Invalid value encountered: ${fc.stringify(t)}`);
      };
      traverseShrink1(
        this.arbitraryBuilder.seed,
        [this.arbitraryBuilder.builder],
        () => {},
        ([t]: [T], u: U) => valid(t, u),
        testSettings
      );
    });
    return this;
  }

  /**
   * Assess the arbitrary is fully equivalent to another one
   */
  isEquivalentTo(
    label: string,
    anotherArbitrary: ((u: U) => Arbitrary<T>) | Arbitrary<T>,
    testSettings?: TestSettings<U>
  ): ArbitraryTestSuite<T, U> {
    const eq = buildEq(this.equality);
    const anotherBuilder = typeof anotherArbitrary === 'function' ? anotherArbitrary : () => anotherArbitrary;
    it(`Should be equivalent to ${label} [isEquivalentTo]`, () => {
      traverseShrink2(
        this.arbitraryBuilder.seed,
        [this.arbitraryBuilder.builder, anotherBuilder],
        () => {},
        ([v1, v2]: [T, T]) => eq(v1, v2),
        testSettings
      );
    });
    return this;
  }
}

export const arbitraryTestSuite = function<T, U>(suiteSettings: TestSuiteSettings<T, U>) {
  return new ArbitraryTestSuite<T, U>(suiteSettings);
};
