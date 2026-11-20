import { assert, integer, property, type RunDetails } from 'fast-check';

import * as fc from 'fast-check';

declare function chooseReporter(): ((details: RunDetails<[number]>) => void) | undefined;
let reporterCallback = chooseReporter();
const assessment = assert(property(integer(), Number.isInteger), {
  noDefaultPlugins: true,

  plugins: [(() => {
    const capturedReporter = reporterCallback;

    return capturedReporter === void 0 ? fc.defaultReporter() : () => ({
      onAllRunsComplete: capturedReporter
    });
  })()]
});
reporterCallback = undefined;
await assessment;
