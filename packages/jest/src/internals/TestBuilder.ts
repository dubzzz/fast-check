import { record } from 'fast-check';
import { buildTestWithPropRunner } from './TestWithPropRunnerBuilder.js';

import type { Parameters as FcParameters, ExecutionTree, RunDetails, RunDetailsCommon } from 'fast-check';
import type { ArbitraryTuple, Prop, ArbitraryRecord, PropRecord, It, JestExtra, FcExtra } from './types.js';

/**
 * Type used for any `{it,test}.*.prop` taking tuples
 */
type TestPropTuple<Ts extends [any] | any[], TsParameters extends Ts = Ts> = (
  arbitraries: ArbitraryTuple<Ts>,
  params?: FcParameters<TsParameters>
) => (testName: string, prop: Prop<Ts>, timeout?: number | undefined) => void;

/**
 * Type used for any `{it,test}.*.prop` taking records
 */
type TestPropRecord<Ts, TsParameters extends Ts = Ts> = (
  arbitraries: ArbitraryRecord<Ts>,
  params?: FcParameters<TsParameters>
) => (testName: string, prop: PropRecord<Ts>, timeout?: number | undefined) => void;

/**
 * prop has just been declared for typing reasons, ideally TestProp should be enough
 * and should be used to replace `{ prop: typeof prop }` by `{ prop: TestProp<???> }`
 */
declare const prop: <Ts, TsParameters extends Ts = Ts>(
  arbitraries: Ts extends [any] | any[] ? ArbitraryTuple<Ts> : ArbitraryRecord<Ts>,
  params?: FcParameters<TsParameters>
) => (
  testName: string,
  prop: Ts extends [any] | any[] ? Prop<Ts> : PropRecord<Ts>,
  timeout?: number | undefined
) => void;

function adaptParametersForRecord<Ts>(
  parameters: FcParameters<[Ts]>,
  originalParamaters: FcParameters<Ts>
): FcParameters<Ts> {
  return {
    ...(parameters as Required<FcParameters<[Ts]>>),
    examples: parameters.examples !== undefined ? parameters.examples.map((example) => example[0]) : undefined,
    reporter: originalParamaters.reporter,
    asyncReporter: originalParamaters.asyncReporter,
  };
}

function adaptExecutionTreeForRecord<Ts>(executionSummary: ExecutionTree<[Ts]>[]): ExecutionTree<Ts>[] {
  return executionSummary.map((summary) => ({
    ...summary,
    value: summary.value[0],
    children: adaptExecutionTreeForRecord(summary.children),
  }));
}

function adaptRunDetailsForRecord<Ts>(
  runDetails: RunDetails<[Ts]>,
  originalParamaters: FcParameters<Ts>
): RunDetails<Ts> {
  const adaptedRunDetailsCommon: RunDetailsCommon<Ts> = {
    ...(runDetails as Required<RunDetailsCommon<[Ts]>>),
    counterexample: runDetails.counterexample !== null ? runDetails.counterexample[0] : null,
    failures: runDetails.failures.map((failure) => failure[0]),
    executionSummary: adaptExecutionTreeForRecord(runDetails.executionSummary),
    runConfiguration: adaptParametersForRecord(runDetails.runConfiguration, originalParamaters),
  };
  return adaptedRunDetailsCommon as RunDetails<Ts>;
}

/**
 * Build `{it,test}.*.prop` out of `{it,test}.*`
 * @param testFn - The source `{it,test}.*`
 */
function buildTestProp<Ts extends [any] | any[], TsParameters extends Ts = Ts>(
  testFn: It | It['only' | 'skip' | 'failing' | 'concurrent'] | It['concurrent']['only' | 'skip' | 'failing'],
  jest: JestExtra,
  fc: FcExtra
): TestPropTuple<Ts, TsParameters>;
function buildTestProp<Ts, TsParameters extends Ts = Ts>(
  testFn: It | It['only' | 'skip' | 'failing' | 'concurrent'] | It['concurrent']['only' | 'skip' | 'failing'],
  jest: JestExtra,
  fc: FcExtra
): TestPropRecord<Ts, TsParameters>;
function buildTestProp<Ts extends [any] | any[], TsParameters extends Ts = Ts>(
  testFn: It | It['only' | 'skip' | 'failing' | 'concurrent'] | It['concurrent']['only' | 'skip' | 'failing'],
  jest: JestExtra,
  fc: FcExtra
): TestPropTuple<Ts, TsParameters> | TestPropRecord<Ts, TsParameters> {
  return (arbitraries, params?: FcParameters<TsParameters>) => {
    if (Array.isArray(arbitraries)) {
      return (testName: string, prop: Prop<Ts>, timeout?: number | undefined) =>
        buildTestWithPropRunner(testFn, testName, arbitraries, prop, params, timeout, jest, fc);
    }
    return (testName: string, prop: Prop<Ts>, timeout?: number | undefined) => {
      const recordArb = record(arbitraries as ArbitraryRecord<Ts>);
      const recordParams: FcParameters<[TsParameters]> | undefined =
        params !== undefined
          ? {
              // Spreading a "Required" makes us sure that we don't miss any parameters
              ...(params as Required<FcParameters<TsParameters>>),
              // Following options needs to be converted to fit with the requirements
              examples:
                params.examples !== undefined ? params.examples.map((example): [TsParameters] => [example]) : undefined,
              reporter:
                params.reporter !== undefined
                  ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    (runDetails) => params.reporter!(adaptRunDetailsForRecord(runDetails, params))
                  : undefined,
              asyncReporter:
                params.asyncReporter !== undefined
                  ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    (runDetails) => params.asyncReporter!(adaptRunDetailsForRecord(runDetails, params))
                  : undefined,
            }
          : undefined;
      buildTestWithPropRunner(
        testFn,
        testName,
        [recordArb],
        (value) => (prop as PropRecord<Ts>)(value),
        recordParams,
        timeout,
        jest,
        fc
      );
    };
  };
}

/**
 * Revamped {it,test} with added `.prop`
 */
export type FastCheckItBuilder<T> = T &
  ('each' extends keyof T ? T & { prop: typeof prop } : T) & {
    [K in keyof Omit<T, 'each'>]: FastCheckItBuilder<T[K]>;
  };

/**
 * Build the enriched version of {it,test}, the one with added `.prop`
 */
function enrichWithTestProp<T extends (...args: any[]) => any>(
  testFn: T,
  jest: JestExtra,
  fc: FcExtra
): FastCheckItBuilder<T> {
  let atLeastOneExtra = false;
  const extraKeys: Partial<FastCheckItBuilder<T>> = {};
  for (const key in testFn) {
    if (typeof testFn[key] === 'function') {
      atLeastOneExtra = true;
      extraKeys[key] = key !== 'each' ? enrichWithTestProp(testFn[key] as any, jest, fc) : testFn[key];
    }
  }
  if (!atLeastOneExtra) {
    return testFn as FastCheckItBuilder<T>;
  }
  const enrichedTestFn = (...args: Parameters<T>): ReturnType<T> => testFn(...args);
  if ('each' in testFn) {
    extraKeys['prop' as keyof typeof extraKeys] = buildTestProp(testFn as any, jest, fc) as any;
  }
  return Object.assign(enrichedTestFn, extraKeys) as FastCheckItBuilder<T>;
}

export const buildTest = enrichWithTestProp;
