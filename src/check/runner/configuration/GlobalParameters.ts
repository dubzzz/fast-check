import { getGlobal } from '../../../utils/globalThis';
import { Parameters } from './Parameters';

const globalParametersSymbol = Symbol.for('fast-check/GlobalParameters');

export type GlobalParameters = Pick<Parameters, Exclude<keyof Parameters, 'path' | 'examples'>>;

/**
 * Define global parameters that will be used by all the runners
 *
 * ```typescript
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
export const configureGlobal = (parameters: GlobalParameters): void => {
  getGlobal()[globalParametersSymbol] = parameters;
};

/**
 * Read global parameters that will be used by runners
 */
export const readConfigureGlobal = (): GlobalParameters | undefined => {
  return getGlobal()[globalParametersSymbol];
};

/**
 * Reset global parameters
 */
export const resetConfigureGlobal = (): void => {
  delete getGlobal()[globalParametersSymbol];
};
