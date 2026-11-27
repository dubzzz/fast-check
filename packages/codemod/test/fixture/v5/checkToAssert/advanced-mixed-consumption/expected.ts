import * as fc from 'fast-check';

const property = fc.property(fc.nat(), (n) => n < 100);
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
if (out.failed) console.log(out.counterexample);
const checkProperty2 = property;
let checkDetails2!: fc.RunDetails<ReturnType<typeof checkProperty2.generate>['value']>;
await fc.assert(checkProperty2, {
  noDefaultPlugins: true,
  plugins: [() => ({ onAllRunsComplete(result) { checkDetails2 = result; } })],
});
const details = checkDetails2;
if (details.failed) console.log(details.counterexample);
