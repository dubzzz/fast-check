import * as fc from 'fast-check';

const property = fc.property(fc.nat(), (n) => n < 100);
const failed = assertAndGetRunDetailsSync(property).failed;
const { seed, counterexample: value } = assertAndGetRunDetailsSync(property, { seed: 42 });
console.log(failed, seed, value);
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
