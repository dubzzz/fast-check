import type { IRawProperty } from '../property/IRawProperty.js';
import type { RunDetails } from '../runner/reporter/RunDetails.js';

/**
 * Runtime part of a plugin.
 *
 * The runtime part is made of the hooks called by the runner.
 * Hooks will be called when relevant for the runner.
 *
 * All the hooks are optional.
 *
 * @remarks Since 4.10.0
 * @public
 */
export type PluginInstance<Ts> = {
  /**
   * Enrich the execution of the predicate linked to the property with extra behaviors.
   * Called once per execution of the predicate.
   *
   * WARNING: `nestedRun` never throws and neither should the function returned by `decorateRun`.
   * WARNING: If run returns synchronously, the decorated function must too.
   *
   * @remarks Since 4.10.0
   */
  decorateRun?: (nestedRun: IRawProperty<Ts, boolean>['run']) => IRawProperty<Ts, boolean>['run'];
  /**
   * Called once at the end of the full property assessment.
   * Gets called with the result of the execution.
   *
   * Throwing allows you to override the default error reporting provided by {@link assert}.
   * But it won't stop other `onAllRunsComplete` from running, their failures if any will just be ignored.
   *
   * WARNING: Always return synchronously for synchronous properties.
   *
   * @remarks Since 4.10.0
   */
  onAllRunsComplete?: (runDetails: RunDetails<Ts>) => Promise<void> | void;
  /**
   * Called once at the end of the full property assessment and after all other life-cycle hooks.
   * Allows you to clean-up and release resources that you needed during the execution of the plugin.
   *
   * No matter the throwing status of `onAllRunsComplete` or other `afterAll`, all `afterAll` will be called.
   * At reporting time, if any of the provided `onAllRunsComplete` or `afterAll` failed the first having failed will be reported and all others will be swallowed.
   *
   * WARNING: Always return synchronously for synchronous properties.
   *
   * @remarks Since 4.10.0
   */
  afterAll?: () => Promise<void> | void;
};

/**
 * Builder instantiating a plugin.
 * Each property will instantiate its own plugin when starting to be assessed via {@link check} or {@link assert}.
 *
 * Parameters received by the Plugin function:
 * - 1st argument or pluginIndex: Corresponds to the index of the plugin within the run (starts at zero).
 *   Plugins are instantiated in order. As such, for a given batch expect to see index 0 instantiated first, followed by others.
 * - 2nd argument or crossPluginContext: Context parameter shared across all builders.
 *   The variable can be leveraged to exchange insights with other builders.
 *   As such it is writable and can be mutated via the builder.
 *   We recommend using symbol keys when adding entries to the variable to reduce the risk of collision with other unrelated plugins.
 *
 * @remarks Since 4.10.0
 * @public
 */
export type Plugin<Ts> = (pluginIndex: number, crossPluginContext: { [K in any]?: unknown }) => PluginInstance<Ts>;
