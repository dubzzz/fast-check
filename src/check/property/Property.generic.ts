import { Random } from '../../random/generator/Random';
import { Arbitrary } from '../arbitrary/definition/Arbitrary';
import { Shrinkable } from '../arbitrary/definition/Shrinkable';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { IRawProperty, runIdToFrequency } from './IRawProperty';
import { readConfigureGlobal, GlobalPropertyHookFunction } from '../runner/configuration/GlobalParameters';

/**
 * Type of legal hook function that can be used to call `beforeEach` or `afterEach`
 * on a {@link IPropertyWithHooks}
 *
 * @public
 */
export type PropertyHookFunction = (globalHookFunction: GlobalPropertyHookFunction) => void;

/**
 * Interface for synchronous property, see {@link IRawProperty}
 * @public
 */
export interface IProperty<Ts> extends IRawProperty<Ts, false> {}

/**
 * Interface for synchronous property defining hooks, see {@link IProperty}
 * @public
 */
export interface IPropertyWithHooks<Ts> extends IProperty<Ts> {
  /**
   * Define a function that should be called before all calls to the predicate
   * @param invalidHookFunction - Function to be called, please provide a valid hook function
   */
  beforeEach(
    invalidHookFunction: (hookFunction: GlobalPropertyHookFunction) => Promise<unknown>
  ): 'beforeEach expects a synchronous function but was given a function returning a Promise';

  /**
   * Define a function that should be called before all calls to the predicate
   * @param hookFunction - Function to be called
   */
  beforeEach(hookFunction: PropertyHookFunction): IPropertyWithHooks<Ts>;

  /**
   * Define a function that should be called after all calls to the predicate
   * @param invalidHookFunction - Function to be called, please provide a valid hook function
   */
  afterEach(
    invalidHookFunction: (hookFunction: GlobalPropertyHookFunction) => Promise<unknown>
  ): 'afterEach expects a synchronous function but was given a function returning a Promise';
  /**
   * Define a function that should be called after all calls to the predicate
   * @param hookFunction - Function to be called
   */
  afterEach(hookFunction: PropertyHookFunction): IPropertyWithHooks<Ts>;
}

/**
 * Property, see {@link IProperty}
 *
 * Prefer using {@link property} instead
 *
 * @internal
 */
export class Property<Ts> implements IProperty<Ts>, IPropertyWithHooks<Ts> {
  static dummyGlobalHook: GlobalPropertyHookFunction = () => {};
  static defaultHook: PropertyHookFunction = (globalHook) => globalHook();
  private readonly globalBeforeEachHook: GlobalPropertyHookFunction;
  private readonly globalAfterEachHook: GlobalPropertyHookFunction;
  private beforeEachHook: PropertyHookFunction = Property.defaultHook;
  private afterEachHook: PropertyHookFunction = Property.defaultHook;
  constructor(readonly arb: Arbitrary<Ts>, readonly predicate: (t: Ts) => boolean | void) {
    const { beforeEach = Property.dummyGlobalHook, afterEach = Property.dummyGlobalHook } = readConfigureGlobal() || {};
    this.globalBeforeEachHook = beforeEach;
    this.globalAfterEachHook = afterEach;
  }
  isAsync = () => false as const;
  generate(mrng: Random, runId?: number): Shrinkable<Ts> {
    return runId != null ? this.arb.withBias(runIdToFrequency(runId)).generate(mrng) : this.arb.generate(mrng);
  }
  run(v: Ts): PreconditionFailure | string | null {
    this.beforeEachHook(this.globalBeforeEachHook);
    try {
      const output = this.predicate(v);
      return output == null || output === true ? null : 'Property failed by returning false';
    } catch (err) {
      // precondition failure considered as success for the first version
      if (PreconditionFailure.isFailure(err)) return err;
      // exception as string in case of real failure
      if (err instanceof Error && err.stack) return `${err}\n\nStack trace: ${err.stack}`;
      return `${err}`;
    } finally {
      this.afterEachHook(this.globalAfterEachHook);
    }
  }

  beforeEach(invalidHookFunction: (hookFunction: GlobalPropertyHookFunction) => Promise<unknown>): never;
  beforeEach(validHookFunction: PropertyHookFunction): Property<Ts>;
  beforeEach(hookFunction: PropertyHookFunction): unknown {
    this.beforeEachHook = hookFunction;
    return this;
  }

  afterEach(invalidHookFunction: (hookFunction: GlobalPropertyHookFunction) => Promise<unknown>): never;
  afterEach(hookFunction: PropertyHookFunction): Property<Ts>;
  afterEach(hookFunction: PropertyHookFunction): unknown {
    this.afterEachHook = hookFunction;
    return this;
  }
}
