import * as fc from 'fast-check';

const details = assertAndGetRunDetailsSync(fc.property(fc.nat(), () => false));
console.log(details.failed);
function assertAndGetRunDetailsSync<Ts>(property: Parameters<typeof fc.assert<Ts>>[0], params?: fc.Parameters<Ts>) {
  let details: fc.RunDetails<Ts> | undefined;
  const execution = fc.assert(property, {
    ...params,
    noDefaultPlugins: true,
    plugins: [...(params?.plugins ?? []), () => ({ onAllRunsComplete(result) { details = result; } })],
  });
  if (details === undefined) {
    if (execution !== undefined) void execution.catch(() => {});
    throw new Error('Expected synchronous check execution; use an asynchronous helper and await its result.');
  }
  return details;
}
