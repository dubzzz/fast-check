import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { Property } from '../property/types/Property.js';
import type { PropertyFailure } from '../property/types/PropertyFailure.js';
import { possiblyAsyncStringify, stringify } from '../../utils/stringify.js';
import type { UniversalPlugin } from './Plugin.js';
import type { PredicateExecutionContext } from '../property/types/PredicateExecutionContext.js';

const valueIsChangingWithAsyncRun = Symbol('fast-check.plugins.equalValuesRunner.valueIsChangingWithAsyncRun');
const valueIsChangingWithSyncRun = Symbol('fast-check.plugins.equalValuesRunner.valueIsChangingWithSyncRun');

type RunOutput = Awaited<ReturnType<Property<unknown>['run']>>;
type CoveredCase = RunOutput | typeof valueIsChangingWithAsyncRun | typeof valueIsChangingWithSyncRun;

function fromCached(cachedValue: RunOutput): RunOutput {
  if (cachedValue !== null) {
    return cachedValue satisfies PreconditionFailure | PropertyFailure;
  }
  return new PreconditionFailure(); // already encountered with sync success, so skip it
}

function forceRun(
  coveredCases: Map<string, CoveredCase>,
  nestedRun: Property<unknown>['run'],
  value: unknown,
  executionContext: PredicateExecutionContext,
  stringifiedValue: string,
): ReturnType<typeof nestedRun> {
  const out = nestedRun(value, executionContext);

  if (out === null || !('then' in out)) {
    // The synchronous execution path
    const secondStringifiedValue = stringify(value);
    if (stringifiedValue === secondStringifiedValue) {
      coveredCases.set(secondStringifiedValue, out);
    } else {
      coveredCases.set(stringifiedValue, valueIsChangingWithSyncRun);
      coveredCases.set(secondStringifiedValue, out);
    }
    return out;
  }

  // The asynchronous execution path
  return out.then((awaitedOut) => {
    // By spec `out` should never throw
    return Promise.resolve(possiblyAsyncStringify(value)).then((secondStringifiedValue) => {
      // We don't expect the built-in stringify helpers to throw
      if (stringifiedValue === secondStringifiedValue) {
        coveredCases.set(secondStringifiedValue, awaitedOut);
      } else {
        coveredCases.set(stringifiedValue, valueIsChangingWithAsyncRun);
        coveredCases.set(secondStringifiedValue, awaitedOut);
      }
      return awaitedOut;
    });
  });
}

function equalValuesRunner(
  coveredCases: Map<string, CoveredCase>,
  nestedRun: Property<unknown>['run'],
  value: unknown,
  executionContext: PredicateExecutionContext,
  skipRuns: boolean,
): ReturnType<typeof nestedRun> {
  const stringifiedValue = stringify(value);

  if (!coveredCases.has(stringifiedValue)) {
    // Not covered yet! We force the run
    return forceRun(coveredCases, nestedRun, value, executionContext, stringifiedValue);
  }

  // oxlint-disable-next-line typescript/no-non-null-assertion
  const coveredCase = coveredCases.get(stringifiedValue)!;

  if (coveredCase === valueIsChangingWithSyncRun) {
    // We cannot do anything for values changing due to the execution of a synchronous predicate (eg.: pull from the value changes the way it gets stringified)
    // We have to force the run again
    return forceRun(coveredCases, nestedRun, value, executionContext, stringifiedValue);
  }

  if (coveredCase === valueIsChangingWithAsyncRun) {
    // When we know that the value has changed after an async predicate execution, we try to asyncjronously compute its stringified version just in case
    // If matching an existing case, we can drop the run, otherwise we keep the run
    return Promise.resolve(possiblyAsyncStringify(value)).then((asyncStringifiedValue) => {
      // We don't expect the built-in stringify helpers to throw
      if (!coveredCases.has(asyncStringifiedValue)) {
        // Not covered yet! We force the run
        return forceRun(coveredCases, nestedRun, value, executionContext, stringifiedValue);
      }
      // oxlint-disable-next-line typescript/no-non-null-assertion
      const coveredAsyncCase = coveredCases.get(asyncStringifiedValue)!;
      if (coveredAsyncCase === valueIsChangingWithAsyncRun || coveredAsyncCase === valueIsChangingWithSyncRun) {
        // Improperly covered! We force the run
        return forceRun(coveredCases, nestedRun, value, executionContext, stringifiedValue);
      }
      return skipRuns ? fromCached(coveredAsyncCase) : coveredAsyncCase;
    });
  }

  // For nominal cases we simply return the existing case
  return skipRuns ? fromCached(coveredCase) : coveredCase;
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
    const coveredCases = new Map<string, CoveredCase>();
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
    const coveredCases = new Map<string, CoveredCase>();
    return {
      decorateRun: (nestedRun) => (value, executionContext) =>
        equalValuesRunner(coveredCases, nestedRun, value, executionContext, true),
    };
  };
}
