import * as fc from 'fast-check';

const first = sideEffect(),
  failed = (function<Ts>(checkProperty: Parameters<typeof fc.assert<Ts>>[0]) {
    let checkDetails: fc.RunDetails<Ts> | undefined;
    const checkExecution = fc.assert(checkProperty, {
      noDefaultPlugins: true,
      plugins: [() => ({ onAllRunsComplete(result) { checkDetails = result; } })],
    });
    if (checkDetails === undefined) {
      void Promise.resolve(checkExecution).catch(() => {});
      throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
    }
    return checkDetails;
  })(property).failed;
const conditional = enabled && (function<Ts2>(checkProperty2: Parameters<typeof fc.assert<Ts2>>[0]) {
  let checkDetails2: fc.RunDetails<Ts2> | undefined;
  const checkExecution2 = fc.assert(checkProperty2, {
    noDefaultPlugins: true,
    plugins: [() => ({ onAllRunsComplete(result) { checkDetails2 = result; } })],
  });
  if (checkDetails2 === undefined) {
    void Promise.resolve(checkExecution2).catch(() => {});
    throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
  }
  return checkDetails2;
})(property).failed;
for (const out = (function<Ts3>(checkProperty3: Parameters<typeof fc.assert<Ts3>>[0]) {
  let checkDetails3: fc.RunDetails<Ts3> | undefined;
  const checkExecution3 = fc.assert(checkProperty3, {
    noDefaultPlugins: true,
    plugins: [() => ({ onAllRunsComplete(result) { checkDetails3 = result; } })],
  });
  if (checkDetails3 === undefined) {
    void Promise.resolve(checkExecution3).catch(() => {});
    throw new Error('Expected synchronous check execution; await the assertion to consume asynchronous results.');
  }
  return checkDetails3;
})(property); out.failed;) break;
