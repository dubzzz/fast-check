import * as fc from 'fast-check';
function custom(details) {
  keep(details);
}
fc.assert(prop, { reporter: custom, seed: 42, timeout: 100, plugins: [other] });
fc.assert(prop, {
  asyncReporter: async (details) => {
    await collect(details);
  },
});
fc.assert(prop, { includeErrorInReport: true });
fc.assert(prop, { includeErrorInReport: false });
fc.check(prop, { reporter: custom });
fc.assert(prop, {
  reporter(details) {
    consume(details);
  },
});
