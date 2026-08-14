import type { IRawProperty } from '../property/IRawProperty.js';

// better name needed for session? maybe another term would fit better?

export type PluginRuntime<Ts, IsAsync extends boolean> = {
  asyncOnly?: IsAsync;
  // wrapping calls to property.run(v)
  // returned run call inplace of property::run, the custom run is theoritically supposed to wrap the source run
  // and enrich its behavior with custom things not coming by default (eg.: timeout)
  decorateRun?: (nestedRun: IRawProperty<Ts, IsAsync>['run']) => IRawProperty<Ts, IsAsync>['run'];
  // called when session ends
  endSession?: () => void;
};

// The Plugin is a builder function called when the assert/check execution flows starts
// it is responsible to instatiate the plugin at init time
// The variable called sharedSessionContext will be passed to all Plugins being instantiated for this assert/chekc flow.
// This variable is only read by plugins and share with all of them. It can be used to share details between two instances of plugins
// evolving in the same assert/check. As such we can envision leveraging it to merge all instanbces of a given plugin into a single
// wrapper. Eg.: beforeEach(beforeEach(beforeEach(...))) could be beforeEachs(...) withg the first (or last) instance of the plugin stacking all the others.
export type Plugin<Ts, IsAsync extends boolean> = (sharedSessionContext: { [K in any]?: unknown }) => PluginRuntime<
  Ts,
  IsAsync
>;

// Eg for beforeEach
const beforeEachPluginSymbol = Symbol();
export function beforeEachPlugin<Ts>(fn: () => void): Plugin<Ts, false> {
  return function startSession(sharedSessionContext: { [K in any]?: unknown }): PluginRuntime<Ts, false> {
    if (beforeEachPluginSymbol in sharedSessionContext) {
      const otherInstancesOfPlugin = sharedSessionContext[beforeEachPluginSymbol] as (() => void)[];
      otherInstancesOfPlugin.push(fn);
      return {}; // no runtime for this instance, delegated to the first instance
    }
    sharedSessionContext[beforeEachPluginSymbol] = [fn];
    return {
      decorateRun: (nestedRun) => (value) => {
        fn();
        return nestedRun(value);
      },
    };
  };
}
