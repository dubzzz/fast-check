import type { UniversalPlugin } from './Plugin.js';

/**
 * Forces values passed to the predicate to be generated without bias.
 * By default, arbitraries tasked to generate biased values.
 *
 * @example
 * ```ts
 * await fc.assert(
 *   fc.property(..., (...) => {...}),
 *   { plugins: [fc.unbiased()] }
 * )
 * ```
 *
 * @remarks Since 4.10.0
 * @public
 */
export function unbiased(): UniversalPlugin {
  return () => {
    return {
      decorateGenerate: (nestedGenerate) => (mrng, _runId) => nestedGenerate(mrng, undefined),
    };
  };
}
