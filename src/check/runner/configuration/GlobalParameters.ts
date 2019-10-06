import { getGlobal } from '../../../utils/globalThis';
import { Parameters } from './Parameters';

const globalParametersSymbol = Symbol.for('fast-check/GlobalParameters');

/**
 * Define global parameters that will be used by all the runners
 *
 * ```ts
 * fc.configureGlobal({ numRuns: 10 });
 * //...
 * fc.assert(
 *   fc.property(
 *     fc.nat(), fc.nat(),
 *     (a, b) => a + b === b + a
 *   ), { seed: 42 }
 * ) // equivalent to { numRuns: 10, seed: 42 }
 * ```
 *
 * @param parameters Global parameters
 */
export const configureGlobal = (parameters: Parameters<never>): void => {
  getGlobal()[globalParametersSymbol] = parameters;
};

/**
 * Read global parameters that will be used by runners
 */
export const readConfigureGlobal = (): Parameters<never> | undefined => {
  return getGlobal()[globalParametersSymbol];
};

/**
 * Reset global parameters
 */
export const resetConfigureGlobal = (): void => {
  delete getGlobal()[globalParametersSymbol];
};
