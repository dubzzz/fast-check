import { Random } from '../../../random/generator/Random';
import { Stream } from '../../../stream/Stream';
import { Arbitrary } from './Arbitrary';
import { Shrinkable } from './Shrinkable';

/**
 * Abstract class able to generate and shrink values on type `T`
 */
abstract class ArbitraryWithShrink<T> extends Arbitrary<T> {
  /**
   * Generate a value of type `T` along with its shrink method
   * based on the provided random number generator
   *
   * @param mrng Random number generator
   * @returns Random value of type `T` and its shrinker
   */
  abstract generate(mrng: Random): Shrinkable<T>;

  /**
   * Produce a stream of shrinks of value
   *
   * @param value Value to shrink
   * @param shrunkOnce Indicate whether its the first shrink (default: false)
   * @returns Stream of shrinks associated to value
   */
  abstract shrink(value: T, shrunkOnce?: boolean): Stream<T>;

  /**
   * Build the Shrinkable associated to value
   *
   * @param value Value to shrink
   * @param shrunkOnce Indicate whether its the first shrink
   * @returns Shrinkable associated to value
   */
  shrinkableFor(value: T, shrunkOnce?: boolean): Shrinkable<T> {
    return new Shrinkable(value, () => this.shrink(value, shrunkOnce === true).map(v => this.shrinkableFor(v, true)));
  }
}

export { ArbitraryWithShrink };
