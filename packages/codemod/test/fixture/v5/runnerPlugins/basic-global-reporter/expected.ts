import * as fc from 'fast-check';

fc.configureGlobal({ noDefaultPlugins: true });

fc.installGlobalPlugin((): import('fast-check').PluginInstance<unknown> => ({
  onAllRunsComplete: (details) => console.log(details.failed)
}));
