import type { Plugin, PluginInstance } from './Plugin.js';

/**
 * Force the generation of values for the predicate to provide us with unbiased values.
 * By default, without anything forcing the drop of bias, arbitraries will be asked to bias their generated values.
 *
 * @example
 * ```ts
 * fc.assert(
 *   fc.property(..., (...) => {...}),
 *   { plugins: [fc.unbiased()] }
 * )
 * ```
 *
 * @remarks Since 4.10.0
 * @public
 */
export function unbiased(): Plugin<unknown> {
  return (): PluginInstance<unknown> => {
    return {
      decorateGenerate: (nestedGenerate) => (mrng, _runId) => nestedGenerate(mrng, undefined),
    };
  };
}
