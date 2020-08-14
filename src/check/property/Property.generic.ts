import { Random } from '../../random/generator/Random';
import { Arbitrary } from '../arbitrary/definition/Arbitrary';
import { Shrinkable } from '../arbitrary/definition/Shrinkable';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { IRawProperty, runIdToFrequency } from './IRawProperty';

/**
 * Interface for synchronous property, see {@link IRawProperty}
 * @public
 */
export interface IProperty<Ts> extends IRawProperty<Ts, false> {}

type HookFunction = () => void;

/**
 * Property, see {@link IProperty}
 *
 * Prefer using {@link property} instead
 *
 * @internal
 */
export class Property<Ts> implements IProperty<Ts> {
  static dummyHook: HookFunction = () => {};
  private beforeEachHook: HookFunction = Property.dummyHook;
  private afterEachHook: HookFunction = Property.dummyHook;
  constructor(readonly arb: Arbitrary<Ts>, readonly predicate: (t: Ts) => boolean | void) {}
  isAsync = () => false as const;
  generate(mrng: Random, runId?: number): Shrinkable<Ts> {
    return runId != null ? this.arb.withBias(runIdToFrequency(runId)).generate(mrng) : this.arb.generate(mrng);
  }
  run(v: Ts): PreconditionFailure | string | null {
    this.beforeEachHook();
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
      this.afterEachHook();
    }
  }

  /**
   * Define a function that should be called before all calls to the predicate
   * @param hookFunction - Function to be called
   */
  beforeEach(
    invalidHookFunction: () => Promise<unknown>
  ): 'beforeEach expects a synchronous function but was given a function returning a Promise';
  beforeEach(validHookFunction: HookFunction): Property<Ts>;
  beforeEach(hookFunction: HookFunction): unknown {
    this.beforeEachHook = hookFunction;
    return this;
  }
  /**
   * Define a function that should be called after all calls to the predicate
   * @param hookFunction - Function to be called
   */
  afterEach(
    invalidHookFunction: () => Promise<unknown>
  ): 'afterEach expects a synchronous function but was given a function returning a Promise';
  afterEach(validHookFunction: HookFunction): Property<Ts>;
  afterEach(hookFunction: HookFunction): unknown {
    this.afterEachHook = hookFunction;
    return this;
  }
}
