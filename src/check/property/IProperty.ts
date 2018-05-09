import Random from '../../random/generator/Random';
import Stream from '../../stream/Stream';
import Shrinkable from '../arbitrary/definition/Shrinkable';

/**
 * Property
 *
 * A property is the combination of:
 * - Arbitraries: how to generate the inputs for the algorithm
 * - Predicate: how to confirm the algorithm succeeded?
 */
export default interface IProperty<Ts> {
  /**
   * Is the property asynchronous?
   *
   * true in case of asynchronous property, false otherwise
   */
  isAsync(): boolean;
  /**
   * Generate values of type Ts
   */
  generate(mrng: Random): Shrinkable<Ts>;
  /**
   * Check the predicate for v
   * @param v Value of which we want to check the predicate
   */
  run(v: Ts): Promise<string | null> | (string | null);
}
