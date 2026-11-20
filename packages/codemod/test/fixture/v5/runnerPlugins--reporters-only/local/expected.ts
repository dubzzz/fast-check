import * as fc from 'fast-check';
function custom(details) {
  keep(details);
}
fc.assert(prop, { seed: 42, timeout: 100, plugins: [other, () => ({
  onAllRunsComplete: custom
})], noDefaultPlugins: true });
fc.assert(prop, {
  noDefaultPlugins: true,

  plugins: [() => ({
    onAllRunsComplete: async (details) => {
      await collect(details);
    }
  })]
});
fc.assert(prop, {
  noDefaultPlugins: true,

  plugins: [fc.defaultReporter({
    includeErrorInReport: true
  })]
});
fc.assert(prop);
fc.check(prop, { reporter: custom });
fc.assert(prop, {
  noDefaultPlugins: true,

  plugins: [() => ({
    onAllRunsComplete: function(details) {
      consume(details);
    }
  })]
});
