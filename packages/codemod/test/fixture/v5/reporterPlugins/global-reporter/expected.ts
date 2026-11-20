import * as fc from 'fast-check';

fc.configureGlobal({ noDefaultPlugins: true });

fc.installGlobalPlugin(() => ({
  onAllRunsComplete: (details) => console.log(details.failed)
}), 'post');
