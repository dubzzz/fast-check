import type { Random } from '../../../random/generator/Random.js';
import type { Arbitrary } from '../../arbitrary/definition/Arbitrary.js';
import { PreconditionFailure } from '../../precondition/PreconditionFailure.js';
import { runIdToFrequency } from './ToFrequency.js';
import type { GlobalPropertyHookFunction } from '../../runner/configuration/GlobalParameters.js';
import { readConfigureGlobal } from '../../runner/configuration/GlobalParameters.js';
import type { Value } from '../../arbitrary/definition/Value.js';
import { nil } from '../../../utils/iterator.js';
import {
  noUndefinedAsContext,
  UndefinedContextPlaceholder,
} from '../../../arbitrary/_internals/helpers/NoUndefinedAsContext.js';
import type { PropertyFailure } from '../types/PropertyFailure.js';
import type { PropertyWithHooks, PropertyHookFunction } from '../types/PropertyWithHooks.js';

// Default hook is a no-op
// oxlint-disable-next-line no-empty-function
const dummyHook: GlobalPropertyHookFunction = () => {};

/** @internal */
function outputToPropertyAnswer(output: boolean | void) {
  return output === undefined || output === true ? null : { error: new Error('Property failed by returning false') };
}

/** @internal */
function errorToPropertyAnswer(err: unknown) {
  // precondition failure considered as success for the first version
  if (PreconditionFailure.isFailure(err)) return err;
  // exception as PropertyFailure in case of real failure
  return { error: err };
}

/**
 * Asynchronous property, see {@link Property}
 *
 * Prefer using {@link asyncProperty} instead
 *
 * @internal
 */
export class PropertyImplem<Ts> implements PropertyWithHooks<Ts> {
  private beforeEachHook: GlobalPropertyHookFunction;
  private afterEachHook: GlobalPropertyHookFunction;
  constructor(
    readonly arb: Arbitrary<Ts>,
    readonly predicate: (t: Ts) => Promise<boolean | void> | boolean | void,
  ) {
    const { beforeEach, afterEach } = readConfigureGlobal() || {};

    this.beforeEachHook = beforeEach || dummyHook;
    this.afterEachHook = afterEach || dummyHook;
  }

  generate(mrng: Random, runId?: number): Value<Ts> {
    const value = this.arb.generate(mrng, runId !== undefined ? runIdToFrequency(runId) : undefined);
    return noUndefinedAsContext(value);
  }

  shrink(value: Value<Ts>): IteratorObject<Value<Ts>> {
    if (value.context === undefined && !this.arb.canShrinkWithoutContext(value.value_)) {
      // `undefined` can only be coming from values derived from examples provided by the user
      // context set to `undefined` are automatically replaced by `UndefinedContextPlaceholder` in generate
      return nil;
    }
    const safeContext = value.context !== UndefinedContextPlaceholder ? value.context : undefined;
    return this.arb.shrink(value.value_, safeContext).map(noUndefinedAsContext);
  }

  runBeforeEach(): Promise<void> | void {
    const out = this.beforeEachHook();
    if (out === undefined) {
      return;
    }
    return Promise.resolve(out).then(() => undefined);
  }

  runAfterEach(): Promise<void> | void {
    const out = this.afterEachHook();
    if (out === undefined) {
      return;
    }
    return Promise.resolve(out).then(() => undefined);
  }

  run(v: Ts): Promise<PreconditionFailure | PropertyFailure | null> | PreconditionFailure | PropertyFailure | null {
    try {
      const syncOutput = this.predicate(v);
      if (typeof syncOutput !== 'object') {
        return outputToPropertyAnswer(syncOutput);
      }
      return syncOutput.then(outputToPropertyAnswer, errorToPropertyAnswer);
    } catch (err) {
      return errorToPropertyAnswer(err);
    }
  }

  /**
   * Define a function that should be called before all calls to the predicate
   * @param hookFunction - Function to be called
   */
  beforeEach(hookFunction: PropertyHookFunction): PropertyImplem<Ts> {
    const previousBeforeEachHook = this.beforeEachHook;
    this.beforeEachHook = () => hookFunction(previousBeforeEachHook);
    return this;
  }
  /**
   * Define a function that should be called after all calls to the predicate
   * @param hookFunction - Function to be called
   */
  afterEach(hookFunction: PropertyHookFunction): PropertyImplem<Ts> {
    const previousAfterEachHook = this.afterEachHook;
    this.afterEachHook = () => hookFunction(previousAfterEachHook);
    return this;
  }
}
