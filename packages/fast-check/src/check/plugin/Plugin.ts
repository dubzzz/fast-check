import type { IRawProperty } from '../property/IRawProperty.js';

// better name needed for session? maybe another term would fit better?

type PluginRuntime<Ts, IsAsync extends boolean> = {
  // wrapping calls to property.run(v)
  decorateRun: (nestedRun: IRawProperty<Ts, IsAsync>['run']) => IRawProperty<Ts, IsAsync>['run'];
  endSession: () => void;
};

// The Plugin is a builder function called when the assert/check execution flows starts
// it is responsible to instatiate the plugin at init time
// The variable called sharedSessionContext will be passed to all Plugins being instantiated for this assert/chekc flow.
// This variable is only read by plugins and share with all of them. It can be used to share details between two instances of plugins
// evolving in the same assert/check. As such we can envision leveraging it to merge all instanbces of a given plugin into a single
// wrapper. Eg.: beforeEach(beforeEach(beforeEach(...))) could be beforeEachs(...) withg the first (or last) instance of the plugin stacking all the others.
type Plugin<T, IsAsync extends boolean> = (sharedSessionContext: object) => PluginRuntime<T, IsAsync>;
