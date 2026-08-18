import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { IRawProperty } from '../property/IRawProperty.js';
import { stringify } from '../../utils/stringify.js';
import type { Plugin, PluginInstance } from './Plugin.js';

/** @internal */
type RunOutput = ReturnType<IRawProperty<unknown, boolean>['run']>;

/** @internal */
function fromSyncCached(cachedValue: Awaited<RunOutput>): Awaited<RunOutput> {
  return cachedValue === null ? new PreconditionFailure() : cachedValue;
}

/** @internal */
function fromCached(cachedValue: RunOutput): RunOutput {
  if (cachedValue !== null && 'then' in cachedValue) {
    return cachedValue.then(fromSyncCached);
  }
  return fromSyncCached(cachedValue);
}

/** @internal */
function buildEqualValuesPlugin(skipRuns: boolean): Plugin<unknown> {
  return (): PluginInstance<unknown> => {
    const coveredCases = new Map<string, RunOutput>();
    return {
      decorateRun: (nestedRun) => (value) => {
        const stringifiedValue = stringify(value);
        if (coveredCases.has(stringifiedValue)) {
          const lastOutput = coveredCases.get(stringifiedValue) as RunOutput;
          return skipRuns ? fromCached(lastOutput) : lastOutput;
        }
        const out = nestedRun(value);
        coveredCases.set(stringifiedValue, out);
        return out;
      },
    };
  };
}

/**
 * Discard runs on already covered cases: never execute the predicate twice on the same value
 * and replay the outcome of the first execution instead. Discarded runs still count as runs.
 *
 * @example
 * ```ts
 * fc.assert(
 *   fc.property(..., (...) => {...}),
 *   { plugins: [fc.ignoreEqualValuesPlugin()] }
 * )
 * ```
 *
 * @remarks Since 4.10.0
 * @public
 */
export function ignoreEqualValues(): Plugin<unknown> {
  return buildEqualValuesPlugin(false);
}

/**
 * Skip runs on already covered cases: never execute the predicate twice on the same value.
 * Contrary to {@link ignoreEqualValues}, a duplicated run whose first execution succeeded is
 * marked as skipped instead of successful: passed the maximal number of skips the run will be
 * marked as failed.
 *
 * @example
 * ```ts
 * fc.assert(
 *   fc.property(..., (...) => {...}),
 *   { plugins: [fc.skipEqualValuesPlugin()] }
 * )
 * ```
 *
 * @remarks Since 4.10.0
 * @public
 */
export function skipEqualValues(): Plugin<unknown> {
  return buildEqualValuesPlugin(true);
}
