import * as fc from 'fast-check';

const checkProperty = property;
let checkDetails!: fc.RunDetails<ReturnType<typeof checkProperty.generate>['value']>;
await fc.assert(checkProperty, {
  noDefaultPlugins: true,
  plugins: [() => ({ onAllRunsComplete(result) { checkDetails = result; } })],
});

const details = checkDetails;
console.log(details.failed);
const checkProperty2 = property;
let checkDetails2: fc.RunDetails<ReturnType<typeof checkProperty2.generate>['value']> | undefined;
const checkExecution = fc.assert(checkProperty2, {
  noDefaultPlugins: true,
  plugins: [() => ({ onAllRunsComplete(result) { checkDetails2 = result; } })],
});
if (checkDetails2 === undefined) {
  void Promise.resolve(checkExecution).catch(() => {});
  throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
}
const out = checkDetails2 as fc.RunDetails<unknown>;
consume(out.failed);
const checkProperty3 = property;
let checkDetails3: fc.RunDetails<ReturnType<typeof checkProperty3.generate>['value']> | undefined;
const checkExecution2 = fc.assert(checkProperty3, {
  noDefaultPlugins: true,
  plugins: [() => ({ onAllRunsComplete(result) { checkDetails3 = result; } })],
});
if (checkDetails3 === undefined) {
  void Promise.resolve(checkExecution2).catch(() => {});
  throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
}
const optional = checkDetails3;
consume(optional?.failed);
const checkProperty4 = property;
let checkDetails4: fc.RunDetails<ReturnType<typeof checkProperty4.generate>['value']> | undefined;
const checkExecution3 = fc.assert(checkProperty4, {
  noDefaultPlugins: true,
  plugins: [() => ({ onAllRunsComplete(result) { checkDetails4 = result; } })],
});
if (checkDetails4 === undefined) {
  void Promise.resolve(checkExecution3).catch(() => {});
  throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
}
const nonNull = checkDetails4;
consume(nonNull!.failed);
