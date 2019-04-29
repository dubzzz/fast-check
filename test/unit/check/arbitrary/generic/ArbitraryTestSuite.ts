import fc from '../../../../../lib/fast-check';

import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';
import { ArbitraryBuilder, TestSuiteSettings, buildEq, buildNotEq, buildCmp } from './helpers/TestSuiteSettings';
import { TestSettings, traverseShrinkN } from './helpers/TraverseShrink';

class ArbitraryTestSuite<T, U> {
  private readonly arbitraryBuilder: ArbitraryBuilder<T, U>;
  private readonly equality?: (a: T, b: T) => boolean | void;
  private readonly builders: ((u: U) => Arbitrary<T>)[];
  private readonly asserts: ((t: T[], u: U, previousValues: ReadonlyArray<T>) => void)[];

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
    this.asserts = [];
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
    this.asserts.push((t: T[]) => eq(t[0], t[builderId]));
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
    // Have we seen the value before? throw if so
    const neq = buildNotEq(this.equality);
    this.asserts.push((t: T[], u: U, previousValues: ReadonlyArray<T>) => previousValues.forEach(v => neq(v, t[0])));
    return this;
  }

  /**
   * Assess shrink path is strictly decreasing
   */
  isAlwaysLowerThanShrink(lowerThan: (a: T, b: T) => boolean | void): ArbitraryTestSuite<T, U> {
    // Strictly lower than the last one? throw if not
    const lt = buildCmp(lowerThan, 'strictly lower');
    this.asserts.push((t: T[], u: U, previousValues: ReadonlyArray<T>) => {
      if (previousValues.length > 0) lt(t[0], previousValues[previousValues.length - 1]);
    });
    return this;
  }

  /**
   * Assess both generation and shrink produce valid values
   */
  isValid(validValue: (t: T, u: U) => boolean | void): ArbitraryTestSuite<T, U> {
    this.asserts.push((t: T[], u: U) => {
      if (!validValue(t[0], u)) throw new Error(`Invalid value encountered: ${fc.stringify(t[0])}`);
    });
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
    this.asserts.push((t: T[]) => eq(t[0], t[builderId]));

    return this;
  }

  run(testSettings?: TestSettings<U>): void {
    let shrinkHistory: T[] = [];

    const withLogResetAssert = () => {
      shrinkHistory = [];
    };
    const withLogAssert = (t: T[], u: U) => {
      try {
        this.asserts.forEach(a => a(t, u, shrinkHistory));
        shrinkHistory.push(t[0]);
      } catch (err) {
        const previousErrorMessage = err.message || err;
        throw new Error(
          `${previousErrorMessage}` +
            `\n\nFailed at depth ${shrinkHistory.length}` +
            `\nwith shrink history: ${
              shrinkHistory.length !== 0 ? shrinkHistory.map(v => fc.stringify(v)).join(' > ') : `\u{2205}`
            }` +
            `\nand current value: ${fc.stringify(t[0])}`
        );
      }
    };

    traverseShrinkN(this.arbitraryBuilder.seed, this.builders, withLogResetAssert, withLogAssert, testSettings);
  }
}

export const arbitraryTestSuite = function<T, U>(suiteSettings: TestSuiteSettings<T, U>) {
  return new ArbitraryTestSuite<T, U>(suiteSettings);
};
