import * as fc from 'fast-check';

await fc.assert(property, {
  plugins: [() => ({ onAllRunsComplete: (details) => log(fc.defaultReportMessage(details)) })],
});
