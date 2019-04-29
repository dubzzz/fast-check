import fc from '../../../../../lib/fast-check';

import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';
import { ArbitraryBuilder, TestSuiteSettings, buildEq, buildNotEq, buildCmp } from './helpers/TestSuiteSettings';
import { TestSettings, traverseShrinkN } from './helpers/TraverseShrink';

class ArbitraryTestSuite<T, U> {
  private readonly arbitraryBuilder: ArbitraryBuilder<T, U>;
  private readonly equality?: (a: T, b: T) => boolean | void;
  private readonly builders: ((u: U) => Arbitrary<T>)[];
  private resetAssert: () => void;
  private assert: (t: T[], u: U) => void;

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
    this.builders = [this.arbitraryBuilder.builder];
    this.resetAssert = () => {};
    this.assert = () => {};
  }

  /**
   * RECOMMENDED -
   * Assess an arbitrary is fully reproducible
   *
   * Check both the generation and the shrinking
   */
  isReproducible(): ArbitraryTestSuite<T, U> {
    const builderId = this.builders.length;
    this.builders.push(this.arbitraryBuilder.builder);

    const eq = buildEq(this.equality);
    const prevAssert = this.assert;
    this.assert = (t: T[], u: U) => {
      eq(t[0], t[builderId]);
      prevAssert(t, u);
    };

    return this;
  }

  /**
   * RECOMMENDED -
   * Assess shrink path is finite
   * and cannot go into an infinite loop
   *
   * Shrink path is not producing shrank values from which it shrank
   */
  isNoInfiniteShrink(): ArbitraryTestSuite<T, U> {
    let shrinkHistory: T[] = [];

    const prevResetAssert = this.resetAssert;
    this.resetAssert = () => {
      shrinkHistory = [];
      prevResetAssert();
    };

    const neq = buildNotEq(this.equality);
    const prevAssert = this.assert;
    this.assert = (t: T[], u: U) => {
      // Have we seen the value before?
      shrinkHistory.forEach(v => neq(v, t[0])); // throw if so
      shrinkHistory.push(t[0]);

      // Other assertions
      prevAssert(t, u);
    };
    return this;
  }

  /**
   * Assess shrink path is strictly decreasing
   */
  isAlwaysLowerThanShrink(lowerThan: (a: T, b: T) => boolean | void): ArbitraryTestSuite<T, U> {
    let lastSeenValue: { value: T } | null = null;

    const prevResetAssert = this.resetAssert;
    this.resetAssert = () => {
      lastSeenValue = null;
      prevResetAssert();
    };

    const lt = buildCmp(lowerThan, 'strictly lower');
    const prevAssert = this.assert;
    this.assert = (t: T[], u: U) => {
      // Strictly lower than the last one
      if (lastSeenValue !== null) lt(t[0], lastSeenValue.value);
      lastSeenValue = { value: t[0] };

      // Other assertions
      prevAssert(t, u);
    };
    return this;
  }

  /**
   * Assess both generation and shrink produce valid values
   */
  isValid(validValue: (t: T, u: U) => boolean | void): ArbitraryTestSuite<T, U> {
    const prevAssert = this.assert;
    this.assert = (t: T[], u: U) => {
      if (!validValue(t[0], u)) throw new Error(`Invalid value encountered: ${fc.stringify(t)}`);
      prevAssert(t, u);
    };
    return this;
  }

  /**
   * Assess the arbitrary is fully equivalent to another one
   */
  isEquivalentTo(anotherArbitrary: ((u: U) => Arbitrary<T>) | Arbitrary<T>): ArbitraryTestSuite<T, U> {
    const builderId = this.builders.length;

    const anotherBuilder = typeof anotherArbitrary === 'function' ? anotherArbitrary : () => anotherArbitrary;
    this.builders.push(anotherBuilder);

    const eq = buildEq(this.equality);
    const prevAssert = this.assert;
    this.assert = (t: T[], u: U) => {
      eq(t[0], t[builderId]);
      prevAssert(t, u);
    };

    return this;
  }

  run(testSettings?: TestSettings<U>): void {
    traverseShrinkN(this.arbitraryBuilder.seed, this.builders, this.resetAssert, this.assert, testSettings);
  }
}

export const arbitraryTestSuite = function<T, U>(suiteSettings: TestSuiteSettings<T, U>) {
  return new ArbitraryTestSuite<T, U>(suiteSettings);
};
