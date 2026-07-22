import type { GlobalPropertyHookFunction } from '../../runner/configuration/GlobalParameters.js';
import type { Property } from './Property.js';

/**
 * Type of legal hook function that can be used to call `beforeEach` or `afterEach`
 * on a {@link PropertyWithHooks}
 *
 * @remarks Since 5.0.0
 * @public
 */
export type PropertyHookFunction =
  | ((previousHookFunction: GlobalPropertyHookFunction) => Promise<unknown>)
  | ((previousHookFunction: GlobalPropertyHookFunction) => void);

/**
 * Interface for property defining hooks, see {@link Property}
 * @remarks Since 5.0.0
 * @public
 */
export interface PropertyWithHooks<Ts> extends Property<Ts> {
  /**
   * Define a function that should be called before all calls to the predicate
   * @param hookFunction - Function to be called
   * @remarks Since 1.6.0
   */
  beforeEach(hookFunction: PropertyHookFunction): PropertyWithHooks<Ts>;

  /**
   * Define a function that should be called after all calls to the predicate
   * @param hookFunction - Function to be called
   * @remarks Since 1.6.0
   */
  afterEach(hookFunction: PropertyHookFunction): PropertyWithHooks<Ts>;
}
