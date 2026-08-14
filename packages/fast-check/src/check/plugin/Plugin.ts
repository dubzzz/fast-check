import type { IRawProperty } from '../property/IRawProperty.js';
import type { RunDetails } from '../runner/reporter/RunDetails.js';

// better name needed for session? maybe another term would fit better?

export type PluginInstance<Ts, IsAsync extends boolean> = {
  asyncOnly?: IsAsync;
  /**
   * Enrich the execution of the predicate linked to the property with extra behaviors.
   * Called once per execution of the predicate.
   *
   * WARNING: `nestedRun` never throws and neither should the function returned by `decorateRun`.
   *
   * @remarks Since 4.10.0
   */
  decorateRun?: (nestedRun: IRawProperty<Ts, IsAsync>['run']) => IRawProperty<Ts, IsAsync>['run'];
  /**
   * Called once at the end of the full property assessment.
   * Gets called with the result of the execution.
   *
   * WARNING: `afterAll` must not throw. Throwing would shadow the output of the property execution.
   *
   * @remarks Since 4.10.0
   */
  afterAll?: (runDetails: RunDetails<Ts>) => IsAsync extends true ? Promise<void> | void : void;
};

// The Plugin is a builder function called when the assert/check execution flows starts
// it is responsible to instatiate the plugin at init time
// The variable called crossPluginContext will be passed to all Plugins being instantiated for this assert/chekc flow.
// This variable is only read by plugins and share with all of them. It can be used to share details between two instances of plugins
// evolving in the same assert/check. As such we can envision leveraging it to merge all instanbces of a given plugin into a single
// wrapper. Eg.: beforeEach(beforeEach(beforeEach(...))) could be beforeEachs(...) withg the first (or last) instance of the plugin stacking all the others.
export type Plugin<Ts, IsAsync extends boolean> = (crossPluginContext: { [K in any]?: unknown }) => PluginInstance<
  Ts,
  IsAsync
>;
