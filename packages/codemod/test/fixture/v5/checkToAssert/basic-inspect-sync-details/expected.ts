import * as fc from 'fast-check';

const details = await assertAndGetRunDetails(fc.property(fc.nat(), () => false));
console.log(details.failed);
async function assertAndGetRunDetails<Ts>(property: fc.Property<Ts>, params?: fc.Parameters<Ts>) {
  let details!: fc.RunDetails<Ts>;
  await fc.assert(property, {
    ...params,
    noDefaultPlugins: true,
    plugins: [...(params?.plugins ?? []), () => ({ onAllRunsComplete(result) { details = result; } })],
  });
  return details;
}
