import * as fc from 'fast-check';

const checkProperty = property;
let checkDetails: fc.RunDetails<ReturnType<typeof checkProperty.generate>['value']> | undefined;
const checkExecution = fc.assert(checkProperty, {
  noDefaultPlugins: true,
  plugins: [() => ({ onAllRunsComplete(result) { checkDetails = result; } })],
});
if (checkDetails === undefined) {
  void Promise.resolve(checkExecution).catch(() => {});
  throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
}

const out = checkDetails;
console.log(out.failed);
consume(out);
