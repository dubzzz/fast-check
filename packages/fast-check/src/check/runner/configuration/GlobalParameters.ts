import type { Size } from '../../../arbitrary/_internals/helpers/MaxLengthFromMinLength.js';
import type { Parameters } from './Parameters.js';

let globalParameters: GlobalParameters = {};

/**
 * Type describing the global overrides
 * @remarks Since 1.18.0
 * @public
 */
export type GlobalParameters = Pick<
  Parameters<unknown>,
  Exclude<keyof Parameters<unknown>, 'path' | 'examples' | 'plugins'>
> & {
  /**
   * Define the base size to be used by arbitraries.
   *
   * By default arbitraries not specifying any size will default to it (except in some cases when used defaultSizeToMaxWhenMaxSpecified is true).
   * For some arbitraries users will want to override the default and either define another size relative to this one,
   * or a fixed one.
   *
   * @defaultValue `"small"`
   * @remarks Since 2.22.0
   */
  baseSize?: Size;
  /**
   * When set to `true` and if the size has not been defined for this precise instance,
   * it will automatically default to `"max"` if the user specified a upper bound for the range
   * (applies to length and to depth).
   *
   * When `false`, the size will be defaulted to `baseSize` even if the user specified
   * a upper bound for the range.
   *
   * @remarks Since 2.22.0
   */
  defaultSizeToMaxWhenMaxSpecified?: boolean;
};
/**
 * Define global parameters that will be used by all the runners
 *
 * @example
 * ```typescript
 * fc.configureGlobal({ numRuns: 10 });
 * //...
 * await fc.assert(
 *   fc.property(
 *     fc.nat(), fc.nat(),
 *     (a, b) => a + b === b + a
 *   ), { seed: 42 }
 * ) // equivalent to { numRuns: 10, seed: 42 }
 * ```
 *
 * @param parameters - Global parameters
 *
 * @remarks Since 1.18.0
 * @public
 */
export function configureGlobal(parameters: GlobalParameters): void {
  globalParameters = parameters;
}

/**
 * Read global parameters that will be used by runners
 * @remarks Since 1.18.0
 * @public
 */
export function readConfigureGlobal(): GlobalParameters {
  return globalParameters;
}

/**
 * Reset global parameters
 * @remarks Since 1.18.0
 * @public
 */
export function resetConfigureGlobal(): void {
  globalParameters = {};
}
