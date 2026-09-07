import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { IRawProperty, PropertyFailure } from '../property/IRawProperty.js';
import { stringify } from '../../utils/stringify.js';
import type { Plugin, PluginInstance } from './Plugin.js';

/** @internal */
type RunOutput = ReturnType<IRawProperty<unknown, boolean>['run']>;

/** @internal */
function fromSyncCachedForAsyncPath(cachedValue: Awaited<RunOutput>): Awaited<RunOutput> {
  return cachedValue === null ? new PreconditionFailure() : cachedValue;
}

/** @internal */
function fromCached(cachedValue: RunOutput): RunOutput {
  if (cachedValue !== null) {
    if ('then' in cachedValue) {
      return cachedValue.then(fromSyncCachedForAsyncPath);
    } else {
      return cachedValue satisfies PreconditionFailure | PropertyFailure;
    }
  }
  return new PreconditionFailure(); // already encountered with sync success, so skip it
}

/** @internal */
function equalValuesRunner(
  coveredCases: Map<string, RunOutput>,
  nestedRun: IRawProperty<unknown, boolean>['run'],
  value: unknown,
  skipRuns: boolean,
): ReturnType<typeof nestedRun> {
  const stringifiedValue = stringify(value);
  if (coveredCases.has(stringifiedValue)) {
    const lastOutput = coveredCases.get(stringifiedValue) as RunOutput;
    return skipRuns ? fromCached(lastOutput) : lastOutput;
  }
  const out = nestedRun(value);
  coveredCases.set(stringifiedValue, out);
  return out;
}

/**
 * Never execute the predicate twice on the same value and replay the outcome of the first execution instead.
 * Discarded runs still count as runs.
 *
 * Close to {@link skipEqualValues} except we replay the output of the first passing, meaning the replay counts as a run.
 *
 * WARNING: Detecting equal values is based on stringifying them. It may result in false positives and false negatives.
 *
 * @example
 * ```ts
 * fc.assert(
 *   fc.property(..., (...) => {...}),
 *   { plugins: [fc.ignoreEqualValues()] }
 * )
 * ```
 *
 * @remarks Since 4.10.0
 * @public
 */
export function ignoreEqualValues(): Plugin<unknown> {
  return (): PluginInstance<unknown> => {
    const coveredCases = new Map<string, RunOutput>();
    return {
      decorateRun: (nestedRun) => (value) => equalValuesRunner(coveredCases, nestedRun, value, false),
    };
  };
}

/**
 * Never execute the predicate twice on the same value.
 *
 * A duplicated run whose first execution succeeded is marked as skipped instead of successful.
 * If too many runs get skipped the run will be marked as failed.
 *
 * Close to {@link ignoreEqualValues} except we skip runs having the same value.
 *
 * WARNING: Detecting equal values is based on stringifying them. It may result in false positives and false negatives.
 *
 * @example
 * ```ts
 * fc.assert(
 *   fc.property(..., (...) => {...}),
 *   { plugins: [fc.skipEqualValues()] }
 * )
 * ```
 *
 * @remarks Since 4.10.0
 * @public
 */
export function skipEqualValues(): Plugin<unknown> {
  return (): PluginInstance<unknown> => {
    const coveredCases = new Map<string, RunOutput>();
    return {
      decorateRun: (nestedRun) => (value) => equalValuesRunner(coveredCases, nestedRun, value, true),
    };
  };
}
