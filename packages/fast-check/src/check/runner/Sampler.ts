import type { Arbitrary } from '../arbitrary/definition/Arbitrary.js';
import { PropertyImplem } from '../property/_internals/PropertyImplem.js';
import type { Property } from '../property/types/Property.js';
import { readConfigureGlobal } from './configuration/GlobalParameters.js';
import type { Parameters } from './configuration/Parameters.js';
import { read } from './configuration/QualifiedParameters.js';
import type { QualifiedParameters } from './configuration/QualifiedParameters.js';
import { lazyToss, toss } from './Tosser.js';
import { pathWalk } from './utils/PathWalker.js';
import { assert } from './assert.js';
import type { Plugin } from '../plugin/Plugin.js';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';

function toProperty<Ts>(generator: Property<Ts> | Arbitrary<Ts>): Property<Ts> {
  const prop = !Object.prototype.hasOwnProperty.call(generator, 'runBeforeEach')
    ? new PropertyImplem(generator as Arbitrary<Ts>, () => true)
    : (generator as Property<Ts>);
  return prop;
}

function streamSample<Ts>(
  generator: Property<Ts> | Arbitrary<Ts>,
  params?: Parameters<Ts> | number,
): IterableIterator<Ts> {
  const extendedParams =
    typeof params === 'number'
      ? { ...(readConfigureGlobal() as Parameters<Ts>), numRuns: params }
      : { ...(readConfigureGlobal() as Parameters<Ts>), ...params };
  const qParams: QualifiedParameters<Ts> = read<Ts>(extendedParams);
  const nextProperty = toProperty(generator);
  const shrink = nextProperty.shrink.bind(nextProperty);
  const tossedValues =
    qParams.path.length === 0
      ? toss(nextProperty, qParams.seed, qParams.randomType, qParams.examples)
      : pathWalk(qParams.path, lazyToss(nextProperty, qParams.seed, qParams.randomType, qParams.examples), shrink);
  return tossedValues.take(qParams.numRuns).map((s) => s.value_);
}

/**
 * Generate an array of values using the same runner as {@link assert}
 *
 * WARNING: Has to be awaited
 *
 * Passing a property executes its predicate, including any side effects, and awaits asynchronous predicates.
 * Values skipped by a precondition are excluded. A predicate failure includes the failing value and interrupts
 * sampling without shrinking or reporting the predicate error. Existing interrupts are forwarded unchanged.
 *
 * With a shrink path, visits shrunk values at that level starting from the path until the predicate fails,
 * execution is interrupted, or the candidates are exhausted. As with {@link assert}, `numRuns` does not cap
 * shrink-path replay.
 *
 * @example
 * ```typescript
 * await fc.sample(fc.nat(), {numRuns: 10}); // extract 10 values from fc.nat() Arbitrary
 * await fc.sample(fc.nat(), {seed: 42}); // extract values from fc.nat() as if we were running fc.assert with seed=42
 * await fc.sample(fc.property(fc.nat(), predicate), {seed: 42}); // extract values that would have been produced by the property as if we were running fc.assert with seed=42
 * ```
 *
 * @param generator - {@link Property} or {@link Arbitrary} to extract the values from
 * @param params - `Parameters` passed to {@link assert}
 *
 * @remarks Since 0.0.6
 * @public
 */
function sample<Ts>(generator: Property<Ts> | Arbitrary<Ts>, params?: Parameters<Ts>): Promise<Ts[]>;
/**
 * Generate an array of values from a property, executing its predicate by default.
 *
 * Set `noPredicateExecution` to `true` to sample inputs without executing the predicate or its preconditions.
 * Plugins still run. This option is only available on {@link sample} when its first argument is a property;
 * it cannot be configured globally or passed to other runners.
 *
 * @param generator - {@link Property} to extract the values from
 * @param params - `Parameters` passed to {@link assert}, with an optional predicate opt-out
 *
 * @remarks Since 5.0.0
 * @public
 */
function sample<Ts>(
  generator: Property<Ts>,
  params?: Parameters<Ts> & {
    /** Skip executing the property's predicate. Defaults to `false`. Plugins still run. */
    noPredicateExecution?: boolean;
  },
): Promise<Ts[]>;
async function sample<Ts>(
  generator: Property<Ts> | Arbitrary<Ts>,
  params: Parameters<Ts> & { noPredicateExecution?: boolean } = {},
): Promise<Ts[]> {
  const extractedValue: Ts[] = [];
  const collect = (value: Ts, out: Awaited<ReturnType<Property<Ts>['run']>>) => {
    if (PreconditionFailure.isFailure(out)) {
      return out;
    }
    extractedValue.push(value);
    return out === null ? null : new PreconditionFailure(true);
  };
  const extractor: Plugin<Ts> = () => ({
    decorateRun: (nestedRun) => (value, context) => {
      const out = params.noPredicateExecution === true ? null : nestedRun(value, context);
      return out !== null && 'then' in out ? out.then((result) => collect(value, result)) : collect(value, out);
    },
  });
  const property: Property<Ts> =
    'run' in generator && typeof generator.run === 'function'
      ? generator
      : new PropertyImplem(generator as Arbitrary<Ts>, () => true);
  await assert(property, {
    ...params,
    plugins: [...(params.plugins ?? []), extractor],
  });
  return extractedValue;
}

function round2(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/**
 * Gather useful statistics concerning generated values
 *
 * Print the result in `console.log` or `params.logger` (if defined)
 *
 * @example
 * ```typescript
 * fc.statistics(
 *     fc.nat(999),
 *     v => v < 100 ? 'Less than 100' : 'More or equal to 100',
 *     {numRuns: 1000, logger: console.log});
 * // Classify 1000 values generated by fc.nat(999) into two categories:
 * // - Less than 100
 * // - More or equal to 100
 * // The output will be sent line by line to the logger
 * ```
 *
 * @param generator - {@link Property} or {@link Arbitrary} to extract the values from
 * @param classify - Classifier function that can classify the generated value in zero, one or more categories (with free labels)
 * @param params - Integer representing the number of values to generate or `Parameters` as in {@link assert}
 *
 * @remarks Since 0.0.6
 * @public
 */
function statistics<Ts>(
  generator: Property<Ts> | Arbitrary<Ts>,
  classify: (v: Ts) => string | string[],
  params?: Parameters<Ts> | number,
): void {
  const extendedParams =
    typeof params === 'number'
      ? { ...(readConfigureGlobal() as Parameters<Ts>), numRuns: params }
      : { ...(readConfigureGlobal() as Parameters<Ts>), ...params };
  const qParams: QualifiedParameters<Ts> = read<Ts>(extendedParams);
  const recorded: { [key: string]: number } = {};
  for (const g of streamSample(generator, params)) {
    const out = classify(g);
    const categories: string[] = Array.isArray(out) ? out : [out];
    for (const c of categories) {
      recorded[c] = (recorded[c] || 0) + 1;
    }
  }
  const data = Object.entries(recorded)
    .sort((a, b) => b[1] - a[1])
    .map((i) => [i[0], `${round2((i[1] * 100.0) / qParams.numRuns)}%`]);
  const longestName = data.map((i) => i[0].length).reduce((p, c) => Math.max(p, c), 0);
  const longestPercent = data.map((i) => i[1].length).reduce((p, c) => Math.max(p, c), 0);
  for (const item of data) {
    qParams.logger(`${item[0].padEnd(longestName, '.')}..${item[1].padStart(longestPercent, '.')}`);
  }
}

export { sample, statistics };
