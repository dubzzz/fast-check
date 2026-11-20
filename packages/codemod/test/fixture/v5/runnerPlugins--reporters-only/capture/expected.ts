import { assert } from 'fast-check';
import * as fc from 'fast-check';
let reporterCallback = chooseReporter();
assert(prop, {
  noDefaultPlugins: true,

  plugins: [(() => {
    const capturedReporter = reporterCallback;

    return capturedReporter === void 0 ? fc.defaultReporter() : () => ({
      onAllRunsComplete: capturedReporter
    });
  })()]
});
reporterCallback = anotherReporter;
