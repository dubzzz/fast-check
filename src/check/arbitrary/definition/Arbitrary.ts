import Random from '../../../random/generator/Random';
import Stream from '../../../stream/Stream';
import Shrinkable from './Shrinkable';

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
   * Filter values against `predicate`
   * 
   * All the values produced by the resulting `Arbitrary<T>`
   * will satisfy `predicate(value) == true`
   * 
   * @example
   * ```typescript
   * const integerGenerator: Arbitrary<number> = ...;
   * const evenIntegerGenerator: Arbitrary<number> = integerGenerator.filter(e => e % 2 === 0);
   * // we took an existing arbitrary producing integers and filtered it to keep only even ones
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
   * Map values using `mapper`
   * Each value is the result of applying `mapper` to the originally produced value
   * 
   * @example
   * ```typescript
   * const identityGenerator: Arbitrary<{firstname: string, lastname: string}> = ...;
   * const displayNameGenerator: Arbitrary<string> = identityGenerator.map(e => `${e.firstname} ${e.lastname.toUpperCase()}`);
   * // we took an existing arbitrary producing identities and derived it to have one generating display names
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
   * Create an `Arbitrary<T>` with no shrink
   * on its generated values
   * 
   * @example
   * ```typescript
   * const dataGenerator: Arbitrary<string> = ...;
   * const unshrinkableDataGenerator: Arbitrary<string> = dataGenerator.noShrink();
   * // both dataGenerator and unshrinkableDataGenerator will generate the same values, the only difference is that the later cannot be shrunk
   * ```
   * 
   * @returns New arbitrary with unshrinkable values
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
