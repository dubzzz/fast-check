import { Random } from '../../random/generator/Random';
import { Arbitrary } from '../arbitrary/definition/Arbitrary';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { IRawProperty, runIdToFrequency } from './IRawProperty';
import { readConfigureGlobal, GlobalPropertyHookFunction } from '../runner/configuration/GlobalParameters';
import { INextRawProperty } from './INextRawProperty';
import { NextValue } from '../arbitrary/definition/NextValue';
import { NextArbitrary } from '../arbitrary/definition/NextArbitrary';
import { convertToNext } from '../arbitrary/definition/Converters';
import { Stream } from '../../stream/Stream';

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
    invalidHookFunction: (hookFunction: GlobalPropertyHookFunction) => Promise<unknown>
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
    invalidHookFunction: (hookFunction: GlobalPropertyHookFunction) => Promise<unknown>
  ): 'afterEach expects a synchronous function but was given a function returning a Promise';
  /**
   * Define a function that should be called after all calls to the predicate
   * @param hookFunction - Function to be called
   * @remarks Since 1.6.0
   */
  afterEach(hookFunction: PropertyHookFunction): IPropertyWithHooks<Ts>;
}

/** @internal */
interface INextProperty<Ts> extends INextRawProperty<Ts, false> {}

/** @internal */
interface INextPropertyWithHooks<Ts> extends INextProperty<Ts> {
  beforeEach(
    invalidHookFunction: (hookFunction: GlobalPropertyHookFunction) => Promise<unknown>
  ): 'beforeEach expects a synchronous function but was given a function returning a Promise';

  beforeEach(hookFunction: PropertyHookFunction): INextPropertyWithHooks<Ts>;

  afterEach(
    invalidHookFunction: (hookFunction: GlobalPropertyHookFunction) => Promise<unknown>
  ): 'afterEach expects a synchronous function but was given a function returning a Promise';
  afterEach(hookFunction: PropertyHookFunction): INextPropertyWithHooks<Ts>;
}

/** @internal */
const UndefinedContextPlaceholder = Symbol('UndefinedContextPlaceholder');

/**
 * Property, see {@link IProperty}
 *
 * Prefer using {@link property} instead
 *
 * @internal
 */
export class Property<Ts> implements INextProperty<Ts>, INextPropertyWithHooks<Ts> {
  // Default hook is a no-op
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  static dummyHook: GlobalPropertyHookFunction = () => {};
  private beforeEachHook: GlobalPropertyHookFunction;
  private afterEachHook: GlobalPropertyHookFunction;
  private arb: NextArbitrary<Ts>;
  constructor(rawArb: Arbitrary<Ts>, readonly predicate: (t: Ts) => boolean | void) {
    const {
      beforeEach = Property.dummyHook,
      afterEach = Property.dummyHook,
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
    this.arb = convertToNext(rawArb);
  }

  isAsync(): false {
    return false;
  }

  generate(mrng: Random, runId?: number): NextValue<Ts> {
    const value = this.arb.generate(mrng, runId != null ? runIdToFrequency(runId) : undefined);
    if (value.context !== undefined) {
      return value;
    }
    if (value.hasToBeCloned) {
      return new NextValue(value.value_, UndefinedContextPlaceholder, () => value.value);
    }
    return new NextValue(value.value_, UndefinedContextPlaceholder);
  }

  shrink(value: NextValue<Ts>): Stream<NextValue<Ts>> {
    if (value.context === undefined) {
      // `undefined` can only be coming from values derived from examples provided by the user
      return Stream.nil();
    }
    const safeContext = value.context !== UndefinedContextPlaceholder ? value.context : undefined;
    return this.arb.shrink(value.value_, safeContext);
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
