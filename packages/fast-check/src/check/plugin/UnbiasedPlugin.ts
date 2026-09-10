import type { Plugin, PluginInstance } from './Plugin.js';

/**
 * Forces values passed to the predicate to be generated without bias.
 * By default, arbitraries tasked to generate biased values.
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
