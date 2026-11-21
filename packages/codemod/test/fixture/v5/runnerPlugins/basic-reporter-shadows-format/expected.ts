import * as fc from 'fast-check';

fc.assert(property, {
  noDefaultPlugins: true,
  plugins: [() => ({
    onAllRunsComplete: () => {}
  })],
});
