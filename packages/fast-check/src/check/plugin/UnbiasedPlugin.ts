import type { Plugin, PluginInstance } from './Plugin.js';

/**
 * Generate the values feeding the predicate without any bias.
 * By default, generation is biased: some runs target smaller or more extreme values to uncover
 * common issues earlier. With this plugin declared, all the runs draw from the full range of the
 * arbitraries with no special treatment.
 *
 * @example
 * ```ts
 * fc.assert(
 *   fc.property(..., (...) => {...}),
 *   { plugins: [fc.unbiasedPlugin()] }
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
