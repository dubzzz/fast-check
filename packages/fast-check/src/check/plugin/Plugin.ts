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
   * WARNING: Except in `asyncOnly: true` mode, if run returns synchronously, the decorated function must too.
   *
   * @remarks Since 4.10.0
   */
  decorateRun?: (nestedRun: IRawProperty<Ts, boolean>['run']) => IRawProperty<Ts, boolean>['run'];
  /**
   * Called once at the end of the full property assessment.
   * Gets called with the result of the execution.
   *
   * WARNING: `afterAll` must not throw. Throwing would shadow the output of the property execution.
   * WARNING: Make sure to always return synchronously except if you set `asyncOnly: true`.
   *
   * @remarks Since 4.10.0
   */
  afterAll?: (runDetails: RunDetails<Ts>) => Promise<void> | void;
};

/**
 * Builder instantiating a plugin.
 * Each property will instantiate its own plugin when starting to be assessed via {@link check} or {@link assert}.
 *
 * Parameters received by the Plugin function:
 * - 1st argument or pluginIndex: Corresponds to the index of the plugin (starts at zero).
 * - 2nd argument or crossPluginContext: Context parameter shared across all builders.
 *   The variable can be leveraged to exchange insights with other builders.
 *   As such it is writable and can be mutated via the builder.
 *   We recommend using symbol keys when adding entries to the variable to reduce the risk of collision with other unrelated plugins.
 *
 * @remarks Since 4.10.0
 * @public
 */
export type Plugin<Ts> = (pluginIndex: number, crossPluginContext: { [K in any]?: unknown }) => PluginInstance<Ts>;
