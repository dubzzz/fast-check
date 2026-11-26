import * as fc from 'fast-check';

{
  const out = (async function<Ts>(checkProperty: Parameters<typeof fc.assert<Ts>>[0]) {
    let checkDetails!: fc.RunDetails<Ts>;
    await fc.assert(checkProperty, {
      noDefaultPlugins: true,
      plugins: [() => ({ onAllRunsComplete(result) { checkDetails = result; } })],
    });
    return checkDetails;
  })(property);
  {
    const out = other;
    consume(out);
  }
  await out;
}
{
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
  const out = checkDetails2;
  {
    const out = other;
    out.then(consume);
  }
  consume(out.failed);
}
