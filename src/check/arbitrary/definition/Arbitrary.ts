import Random from '../../../random/generator/Random';
import Stream from '../../../stream/Stream';
import Shrinkable from './Shrinkable';

/**
 * Abstract class able to generate values on type `T`
 */
export default abstract class Arbitrary<T> {
  /**
   * Generate a value of type `T` along with its shrink method
   * based on the provided random number generator
   *
   * @param mrng Random number generator
   * @returns Random value of type `T` and its shrinker
   */
  abstract generate(mrng: Random): Shrinkable<T>;

  /**
   * Create another Arbitrary<T> by filtering values against `predicate`
   *
   * All the values produced by the resulting `Arbitrary<T>`
   * satisfy `predicate(value) == true`
   *
   * @example
   * ```typescript
   * const integerGenerator: Arbitrary<number> = ...;
   * const evenIntegerGenerator: Arbitrary<number> = integerGenerator.filter(e => e % 2 === 0);
   * // new Arbitrary only keeps even values
   * ```
   *
   * @param predicate Predicate, to test each produced element. Return true to keep the element, false otherwise
   * @returns New arbitrary filtered using predicate
   */
  filter(predicate: (t: T) => boolean): Arbitrary<T> {
    const arb = this;
    return new class extends Arbitrary<T> {
      generate(mrng: Random): Shrinkable<T> {
        let g = arb.generate(mrng);
        while (!predicate(g.value)) {
          g = arb.generate(mrng);
        }
        return g.filter(predicate);
      }
    }();
  }

  /**
   * Create another Arbitrary<T> by mapping all produced values using the provided `mapper`
   * Values produced by the new Arbitrary<T> are the result of applying `mapper` to the value coming from the original Arbitrary<T>
   *
   * @example
   * ```typescript
   * const rgbChannels: Arbitrary<{r:number,g:number,b:number}> = ...;
   * const color: Arbitrary<string> = rgbChannels.map(ch => `#${(ch.r*65536 + ch.g*256 + ch.b).toString(16).padStart(6, '0')}`);
   * // transform an Arbitrary producing {r,g,b} integers into an Arbitrary of '#rrggbb'
   * ```
   *
   * @param mapper Map, to produce a new element based on an old one
   * @returns New arbitrary with mapped elements
   */
  map<U>(mapper: (t: T) => U): Arbitrary<U> {
    const arb = this;
    return new class extends Arbitrary<U> {
      generate(mrng: Random): Shrinkable<U> {
        return arb.generate(mrng).map(mapper);
      }
    }();
  }

  /**
   * Create another Arbitrary<T> without shrink
   *
   * @example
   * ```typescript
   * const dataGenerator: Arbitrary<string> = ...;
   * const unshrinkableDataGenerator: Arbitrary<string> = dataGenerator.noShrink();
   * // same values no shrink
   * ```
   *
   * @returns Create another Arbitrary<T> without shrink
   */
  noShrink(): Arbitrary<T> {
    const arb = this;
    return new class extends Arbitrary<T> {
      generate(mrng: Random): Shrinkable<T> {
        return new Shrinkable(arb.generate(mrng).value);
      }
    }();
  }
}

export { Arbitrary };
