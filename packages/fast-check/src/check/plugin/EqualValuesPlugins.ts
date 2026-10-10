import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { Property } from '../property/types/Property.js';
import type { PropertyFailure } from '../property/types/PropertyFailure.js';
import { possiblyAsyncStringify } from '../../utils/stringify.js';
import type { UniversalPlugin } from './Plugin.js';
import type { PredicateExecutionContext } from '../property/types/PredicateExecutionContext.js';

type RunOutput = ReturnType<Property<unknown>['run']>;

function fromSyncCachedForAsyncPath(cachedValue: Awaited<RunOutput>): Awaited<RunOutput> {
  return cachedValue === null ? new PreconditionFailure() : cachedValue;
}

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

function runWithCachedValue(
  coveredCases: Map<string, RunOutput>,
  nestedRun: Property<unknown>['run'],
  value: unknown,
  executionContext: PredicateExecutionContext,
  skipRuns: boolean,
  stringifiedValue: string,
): ReturnType<typeof nestedRun> {
  if (coveredCases.has(stringifiedValue)) {
    const lastOutput = coveredCases.get(stringifiedValue) as RunOutput;
    return skipRuns ? fromCached(lastOutput) : lastOutput;
  }
  const out = nestedRun(value, executionContext);
  coveredCases.set(stringifiedValue, out);
  return out;
}

function equalValuesRunner(
  coveredCases: Map<string, RunOutput>,
  nestedRun: Property<unknown>['run'],
  value: unknown,
  skipRuns: boolean,
): ReturnType<typeof nestedRun> {
  const stringifiedValue = possiblyAsyncStringify(value);
  if (typeof stringifiedValue === 'string') {
    return runWithCachedValue(coveredCases, nestedRun, value, skipRuns, stringifiedValue);
  }
  return stringifiedValue.then((resolved) => runWithCachedValue(coveredCases, nestedRun, value, skipRuns, resolved));
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
 * await fc.assert(
 *   fc.property(..., (...) => {...}),
 *   { plugins: [fc.ignoreEqualValues()] }
 * )
 * ```
 *
 * @remarks Since 4.10.0
 * @public
 */
export function ignoreEqualValues(): UniversalPlugin {
  return () => {
    const coveredCases = new Map<string, RunOutput>();
    return {
      decorateRun: (nestedRun) => (value, executionContext) =>
        equalValuesRunner(coveredCases, nestedRun, value, executionContext, false),
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
 * await fc.assert(
 *   fc.property(..., (...) => {...}),
 *   { plugins: [fc.skipEqualValues()] }
 * )
 * ```
 *
 * @remarks Since 4.10.0
 * @public
 */
export function skipEqualValues(): UniversalPlugin {
  return () => {
    const coveredCases = new Map<string, RunOutput>();
    return {
      decorateRun: (nestedRun) => (value, executionContext) =>
        equalValuesRunner(coveredCases, nestedRun, value, executionContext, true),
    };
  };
}
