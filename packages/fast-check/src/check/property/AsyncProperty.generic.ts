import type { Random } from '../../random/generator/Random';
import type { Arbitrary } from '../arbitrary/definition/Arbitrary';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import type { PropertyFailure, IRawProperty } from './IRawProperty';
import { runIdToFrequency } from './IRawProperty';
import type { GlobalAsyncPropertyHookFunction } from '../runner/configuration/GlobalParameters';
import { readConfigureGlobal } from '../runner/configuration/GlobalParameters';
import type { Value } from '../arbitrary/definition/Value';
import { Stream } from '../../stream/Stream';
import {
  noUndefinedAsContext,
  UndefinedContextPlaceholder,
} from '../../arbitrary/_internals/helpers/NoUndefinedAsContext';
import { Error } from '../../utils/globals';

/**
 * Type of legal hook function that can be used to call `beforeEach` or `afterEach`
 * on a {@link IAsyncPropertyWithHooks}
 *
 * @remarks Since 2.2.0
 * @public
 */
export type AsyncPropertyHookFunction =
  | ((previousHookFunction: GlobalAsyncPropertyHookFunction) => Promise<unknown>)
  | ((previousHookFunction: GlobalAsyncPropertyHookFunction) => void);

/**
 * Interface for asynchronous property, see {@link IRawProperty}
 * @remarks Since 1.19.0
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IAsyncProperty<Ts> extends IRawProperty<Ts, true> {}

/**
 * Interface for asynchronous property defining hooks, see {@link IAsyncProperty}
 * @remarks Since 2.2.0
 * @public
 */
export interface IAsyncPropertyWithHooks<Ts> extends IAsyncProperty<Ts> {
  /**
   * Define a function that should be called before all calls to the predicate
   * @param hookFunction - Function to be called
   * @remarks Since 1.6.0
   */
  beforeEach(hookFunction: AsyncPropertyHookFunction): IAsyncPropertyWithHooks<Ts>;

  /**
   * Define a function that should be called after all calls to the predicate
   * @param hookFunction - Function to be called
   * @remarks Since 1.6.0
   */
  afterEach(hookFunction: AsyncPropertyHookFunction): IAsyncPropertyWithHooks<Ts>;
}

/**
 * Asynchronous property, see {@link IAsyncProperty}
 *
 * Prefer using {@link asyncProperty} instead
 *
 * @internal
 */
export class AsyncProperty<Ts> implements IAsyncPropertyWithHooks<Ts> {
  // Default hook is a no-op
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  static dummyHook: GlobalAsyncPropertyHookFunction = () => {};
  private beforeEachHook: GlobalAsyncPropertyHookFunction;
  private afterEachHook: GlobalAsyncPropertyHookFunction;
  constructor(
    readonly arb: Arbitrary<Ts>,
    readonly predicate: (t: Ts) => Promise<boolean | void>,
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

    this.beforeEachHook = asyncBeforeEach || beforeEach || AsyncProperty.dummyHook;
    this.afterEachHook = asyncAfterEach || afterEach || AsyncProperty.dummyHook;
  }

  isAsync(): true {
    return true;
  }

  generate(mrng: Random, runId?: number): Value<Ts> {
    const value = this.arb.generate(mrng, runId != null ? runIdToFrequency(runId) : undefined);
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

  async runBeforeEach(): Promise<void> {
    await this.beforeEachHook();
  }

  async runAfterEach(): Promise<void> {
    await this.afterEachHook();
  }

  async run(v: Ts): Promise<PreconditionFailure | PropertyFailure | null> {
    try {
      const output = await this.predicate(v);
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

  /**
   * Define a function that should be called before all calls to the predicate
   * @param hookFunction - Function to be called
   */
  beforeEach(hookFunction: AsyncPropertyHookFunction): AsyncProperty<Ts> {
    const previousBeforeEachHook = this.beforeEachHook;
    this.beforeEachHook = () => hookFunction(previousBeforeEachHook);
    return this;
  }
  /**
   * Define a function that should be called after all calls to the predicate
   * @param hookFunction - Function to be called
   */
  afterEach(hookFunction: AsyncPropertyHookFunction): AsyncProperty<Ts> {
    const previousAfterEachHook = this.afterEachHook;
    this.afterEachHook = () => hookFunction(previousAfterEachHook);
    return this;
  }
}
