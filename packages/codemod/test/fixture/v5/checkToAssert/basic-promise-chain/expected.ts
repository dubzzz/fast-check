import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.nat(), async () => true);
const pending = (async function<Ts>(checkProperty: Parameters<typeof fc.assert<Ts>>[0]) {
  let checkDetails!: fc.RunDetails<Ts>;
  await fc.assert(checkProperty, {
    noDefaultPlugins: true,
    plugins: [() => ({ onAllRunsComplete(result) { checkDetails = result; } })],
  });
  return checkDetails;
})(property);
pending.then(console.log);
await pending;
(async function<Ts2>(checkProperty2: Parameters<typeof fc.assert<Ts2>>[0]) {
  let checkDetails2!: fc.RunDetails<Ts2>;
  await fc.assert(checkProperty2, {
    noDefaultPlugins: true,
    plugins: [() => ({ onAllRunsComplete(result) { checkDetails2 = result; } })],
  });
  return checkDetails2;
})(property).then(console.log);
(async function<Ts3>(checkProperty3: Parameters<typeof fc.assert<Ts3>>[0]) {
  let checkDetails3!: fc.RunDetails<Ts3>;
  await fc.assert(checkProperty3, {
    noDefaultPlugins: true,
    plugins: [() => ({ onAllRunsComplete(result) { checkDetails3 = result; } })],
  });
  return checkDetails3;
})(property)['then'](console.log);
