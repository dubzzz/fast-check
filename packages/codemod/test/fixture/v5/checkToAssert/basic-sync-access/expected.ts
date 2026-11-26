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
const failed = checkDetails.failed;
const checkProperty2 = property;
let checkDetails2: fc.RunDetails<ReturnType<typeof checkProperty2.generate>['value']> | undefined;
const checkExecution2 = fc.assert(checkProperty2, {
  noDefaultPlugins: true,
  plugins: [() => ({ onAllRunsComplete(result) { checkDetails2 = result; } })],
});
if (checkDetails2 === undefined) {
  void Promise.resolve(checkExecution2).catch(() => {});
  throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
}
const computed = checkDetails2['failed'];
const checkProperty3 = property;
const checkParams: fc.Parameters<ReturnType<typeof checkProperty3.generate>['value']> | undefined = { seed: 42 };
let checkDetails3: fc.RunDetails<ReturnType<typeof checkProperty3.generate>['value']> | undefined;
const checkExecution3 = fc.assert(checkProperty3, {
  ...checkParams,
  noDefaultPlugins: true,
  plugins: [...(checkParams?.plugins ?? []), () => ({ onAllRunsComplete(result) { checkDetails3 = result; } })],
});
if (checkDetails3 === undefined) {
  void Promise.resolve(checkExecution3).catch(() => {});
  throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
}
const { seed, counterexample: value } = checkDetails3;
let counterexample;
({ counterexample } = (function<Ts>(checkProperty4: Parameters<typeof fc.assert<Ts>>[0]) {
  let checkDetails4: fc.RunDetails<Ts> | undefined;
  const checkExecution4 = fc.assert(checkProperty4, {
    noDefaultPlugins: true,
    plugins: [() => ({ onAllRunsComplete(result) { checkDetails4 = result; } })],
  });
  if (checkDetails4 === undefined) {
    void Promise.resolve(checkExecution4).catch(() => {});
    throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
  }
  return checkDetails4;
})(property));
const checkProperty5 = property;
let checkDetails5: fc.RunDetails<ReturnType<typeof checkProperty5.generate>['value']> | undefined;
const checkExecution5 = fc.assert(checkProperty5, {
  noDefaultPlugins: true,
  plugins: [() => ({ onAllRunsComplete(result) { checkDetails5 = result; } })],
});
if (checkDetails5 === undefined) {
  void Promise.resolve(checkExecution5).catch(() => {});
  throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
}
const out = checkDetails5;
const { numRuns } = out;
await out.failed;
console.log(failed, computed, seed, value, counterexample, numRuns);
