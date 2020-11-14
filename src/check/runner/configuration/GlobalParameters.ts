import { getGlobal } from '../../../utils/globalThis';
import { Parameters } from './Parameters';

/** @internal */
const globalParametersSymbol = Symbol.for('fast-check/GlobalParameters');

/**
 * Type of legal hook function that can be used in the global parameter `beforeEach` and/or `afterEach`
 *
 * @public
 */
export type GlobalPropertyHookFunction = () => void;
/**
 * Type of legal hook function that can be used in the global parameter `asyncBeforeEach` and/or `asyncAfterEach`
 *
 * @public
 */
export type GlobalAsyncPropertyHookFunction = (() => Promise<unknown>) | (() => void);

/**
 * Type describing the global overrides
 * @public
 */
export type GlobalParameters = Pick<Parameters<unknown>, Exclude<keyof Parameters<unknown>, 'path' | 'examples'>> & {
  /**
  Specify a function that will be called before each execution of a property.
  It behaves as-if you manually called `beforeEach` method on all the properties you execute with fast-check.
  
  The function will be used for both {@link fast-check#property} and {@link fast-check#asyncProperty}.
  This global override should never be used in conjunction with `asyncBeforeEach`.
  */
  beforeEach?: GlobalPropertyHookFunction;
  /**
  Specify a function that will be called after each execution of a property.
  It behaves as-if you manually called `afterEach` method on all the properties you execute with fast-check.
  
  The function will be used for both {@link fast-check#property} and {@link fast-check#asyncProperty}.
  This global override should never be used in conjunction with `asyncAfterEach`.
  */
  afterEach?: GlobalPropertyHookFunction;
  /**
  Specify a function that will be called before each execution of an asynchronous property.
  It behaves as-if you manually called `beforeEach` method on all the asynchronous properties you execute with fast-check.
  
  The function will be used only for {@link fast-check#asyncProperty}. It makes synchronous properties created by {@link fast-check#property} unable to run.
  This global override should never be used in conjunction with `beforeEach`.
  */
  asyncBeforeEach?: GlobalAsyncPropertyHookFunction;
  /**
  Specify a function that will be called after each execution of an asynchronous property.
  It behaves as-if you manually called `afterEach` method on all the asynchronous properties you execute with fast-check.
  
  The function will be used only for {@link fast-check#asyncProperty}. It makes synchronous properties created by {@link fast-check#property} unable to run.
  This global override should never be used in conjunction with `afterEach`.
  */
  asyncAfterEach?: GlobalAsyncPropertyHookFunction;
};
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
