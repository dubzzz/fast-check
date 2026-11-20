import { configureGlobal } from 'fast-check';
import * as fc from 'fast-check';
configureGlobal({
  numRuns: 15,
  noDefaultPlugins: true,
});

fc.installGlobalPlugin(() => ({
  onAllRunsComplete: (details) => {
    accept(details);
  }
}), 'post');
