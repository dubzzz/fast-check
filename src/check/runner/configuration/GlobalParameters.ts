import { getGlobal } from '../../../utils/globalThis';
import { Parameters } from './Parameters';

/** @internal */
const globalParametersSymbol = Symbol.for('fast-check/GlobalParameters');

/** @public */
export type GlobalParameters = Pick<Parameters<unknown>, Exclude<keyof Parameters<unknown>, 'path' | 'examples'>>;

/**
 * Define global parameters that will be used by all the runners
 *
 * @example
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
 * @param parameters - Global parameters
 *
 * @public
 */
export function configureGlobal(parameters: GlobalParameters): void {
  getGlobal()[globalParametersSymbol] = parameters;
}

/**
 * Read global parameters that will be used by runners
 * @public
 */
export function readConfigureGlobal(): GlobalParameters | undefined {
  return getGlobal()[globalParametersSymbol];
}

/**
 * Reset global parameters
 * @public
 */
export function resetConfigureGlobal(): void {
  delete getGlobal()[globalParametersSymbol];
}
