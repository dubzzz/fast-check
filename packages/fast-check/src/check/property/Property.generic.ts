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
export type PropertyHookFunction = (globalHookFunction: GlobalPropertyHookFunction) => void;

/**
 * Interface for synchronous property, see {@link IRawProperty}
 * @remarks Since 1.19.0
 * @public
 */
export interface IProperty<Ts> extends IRawProperty<Ts, false> {}

/**
 * Interface for synchronous property defining hooks, see {@link IProperty}
 * @remarks Since 2.2.0
 * @public
 */
export interface IPropertyWithHooks<Ts> extends IProperty<Ts> {
  /**
   * Define a function that should be called before all calls to the predicate
   * @param invalidHookFunction - Function to be called, please provide a valid hook function
   * @remarks Since 1.6.0
   */
  beforeEach(
    invalidHookFunction: (hookFunction: GlobalPropertyHookFunction) => Promise<unknown>,
  ): 'beforeEach expects a synchronous function but was given a function returning a Promise';

  /**
   * Define a function that should be called before all calls to the predicate
   * @param hookFunction - Function to be called
   * @remarks Since 1.6.0
   */
  beforeEach(hookFunction: PropertyHookFunction): IPropertyWithHooks<Ts>;

  /**
   * Define a function that should be called after all calls to the predicate
   * @param invalidHookFunction - Function to be called, please provide a valid hook function
   * @remarks Since 1.6.0
   */
  afterEach(
    invalidHookFunction: (hookFunction: GlobalPropertyHookFunction) => Promise<unknown>,
  ): 'afterEach expects a synchronous function but was given a function returning a Promise';
  /**
   * Define a function that should be called after all calls to the predicate
   * @param hookFunction - Function to be called
   * @remarks Since 1.6.0
   */
  afterEach(hookFunction: PropertyHookFunction): IPropertyWithHooks<Ts>;
}

// Default hook is a no-op
// eslint-disable-next-line @typescript-eslint/no-empty-function
const dummyHook: GlobalPropertyHookFunction = () => {};

/**
 * Property, see {@link IProperty}
 *
 * Prefer using {@link property} instead
 *
 * @internal
 */
export class Property<Ts> implements IProperty<Ts>, IPropertyWithHooks<Ts> {
  private beforeEachHook: GlobalPropertyHookFunction;
  private afterEachHook: GlobalPropertyHookFunction;
  constructor(
    readonly arb: Arbitrary<Ts>,
    readonly predicate: (t: Ts) => boolean | void,
  ) {
    const {
      beforeEach = dummyHook,
      afterEach = dummyHook,
      asyncBeforeEach,
      asyncAfterEach,
    } = readConfigureGlobal() || {};

    if (asyncBeforeEach !== undefined) {
      throw Error('"asyncBeforeEach" can\'t be set when running synchronous properties');
    }

    if (asyncAfterEach !== undefined) {
      throw Error('"asyncAfterEach" can\'t be set when running synchronous properties');
    }

    this.beforeEachHook = beforeEach;
    this.afterEachHook = afterEach;
  }

  isAsync(): false {
    return false;
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

  runBeforeEach(): void {
    this.beforeEachHook();
  }

  runAfterEach(): void {
    this.afterEachHook();
  }

  run(v: Ts): PreconditionFailure | PropertyFailure | null {
    try {
      const output = this.predicate(v);
      return output === undefined || output === true
        ? null
        : { error: new Error('Property failed by returning false') };
    } catch (err) {
      // precondition failure considered as success for the first version
      if (PreconditionFailure.isFailure(err)) return err;
      // exception as PropertyFailure in case of real failure
      return { error: err };
    }
  }

  beforeEach(invalidHookFunction: (hookFunction: GlobalPropertyHookFunction) => Promise<unknown>): never;
  beforeEach(validHookFunction: PropertyHookFunction): Property<Ts>;
  beforeEach(hookFunction: PropertyHookFunction): unknown {
    const previousBeforeEachHook = this.beforeEachHook;
    this.beforeEachHook = () => hookFunction(previousBeforeEachHook);
    return this;
  }

  afterEach(invalidHookFunction: (hookFunction: GlobalPropertyHookFunction) => Promise<unknown>): never;
  afterEach(hookFunction: PropertyHookFunction): Property<Ts>;
  afterEach(hookFunction: PropertyHookFunction): unknown {
    const previousAfterEachHook = this.afterEachHook;
    this.afterEachHook = () => hookFunction(previousAfterEachHook);
    return this;
  }
}
