import type { Random } from '../../random/generator/Random.js';
import type { Arbitrary } from '../arbitrary/definition/Arbitrary.js';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { PropertyFailure, IRawProperty } from './IRawProperty.js';
import { runIdToFrequency } from './IRawProperty.js';
import type { GlobalPropertyHookFunction } from '../runner/configuration/GlobalParameters.js';
import { readConfigureGlobal } from '../runner/configuration/GlobalParameters.js';
import type { Value } from '../arbitrary/definition/Value.js';
import { Stream } from '../../stream/Stream.js';
import {
  noUndefinedAsContext,
  UndefinedContextPlaceholder,
} from '../../arbitrary/_internals/helpers/NoUndefinedAsContext.js';
import { Error } from '../../utils/globals.js';

/**
 * Type of legal hook function that can be used to call `beforeEach` or `afterEach`
 * on a {@link IPropertyWithHooks}
 *
 * @remarks Since 2.2.0
 * @public
 */
export type PropertyHookFunction =
  | ((previousHookFunction: GlobalPropertyHookFunction) => Promise<unknown>)
  | ((previousHookFunction: GlobalPropertyHookFunction) => void);

/**
 * Interface for property, see {@link IRawProperty}
 * @remarks Since 1.19.0
 * @public
 */
export interface IProperty<Ts> extends IRawProperty<Ts> {}

/**
 * Interface for property defining hooks, see {@link IProperty}
 * @remarks Since 2.2.0
 * @public
 */
export interface IPropertyWithHooks<Ts> extends IProperty<Ts> {
  /**
   * Define a function that should be called before all calls to the predicate
   * @param hookFunction - Function to be called
   * @remarks Since 1.6.0
   */
  beforeEach(hookFunction: PropertyHookFunction): IPropertyWithHooks<Ts>;

  /**
   * Define a function that should be called after all calls to the predicate
   * @param hookFunction - Function to be called
   * @remarks Since 1.6.0
   */
  afterEach(hookFunction: PropertyHookFunction): IPropertyWithHooks<Ts>;
}

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
 * Property, see {@link IProperty}
 *
 * Prefer using {@link property} instead
 *
 * @internal
 */
export class Property<Ts> implements IPropertyWithHooks<Ts> {
  // Default hook is a no-op
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  static dummyHook: GlobalPropertyHookFunction = () => {};
  private beforeEachHook: GlobalPropertyHookFunction;
  private afterEachHook: GlobalPropertyHookFunction;
  constructor(
    readonly arb: Arbitrary<Ts>,
    readonly predicate: (t: Ts) => Promise<boolean | void> | boolean | void,
  ) {
    const { asyncBeforeEach, asyncAfterEach, beforeEach, afterEach } = readConfigureGlobal() || {};

    if (asyncBeforeEach !== undefined && beforeEach !== undefined) {
      throw Error(
        'Global "asyncBeforeEach" and "beforeEach" parameters can\'t be set at the same time when running async properties',
      );
    }

    if (asyncAfterEach !== undefined && afterEach !== undefined) {
      throw Error(
        'Global "asyncAfterEach" and "afterEach" parameters can\'t be set at the same time when running async properties',
      );
    }

    this.beforeEachHook = asyncBeforeEach || beforeEach || Property.dummyHook;
    this.afterEachHook = asyncAfterEach || afterEach || Property.dummyHook;
  }

  generate(mrng: Random, runId?: number): Value<Ts> {
    const value = this.arb.generate(mrng, runId !== undefined ? runIdToFrequency(runId) : undefined);
    return noUndefinedAsContext(value);
  }

  shrink(value: Value<Ts>): Stream<Value<Ts>> {
    if (value.context === undefined && !this.arb.canShrinkWithoutContext(value.value_)) {
      // `undefined` can only be coming from values derived from examples provided by the user
      // context set to `undefined` are automatically replaced by `UndefinedContextPlaceholder` in generate
      return Stream.nil();
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
  beforeEach(hookFunction: PropertyHookFunction): Property<Ts> {
    const previousBeforeEachHook = this.beforeEachHook;
    this.beforeEachHook = () => hookFunction(previousBeforeEachHook);
    return this;
  }
  /**
   * Define a function that should be called after all calls to the predicate
   * @param hookFunction - Function to be called
   */
  afterEach(hookFunction: PropertyHookFunction): Property<Ts> {
    const previousAfterEachHook = this.afterEachHook;
    this.afterEachHook = () => hookFunction(previousAfterEachHook);
    return this;
  }
}
