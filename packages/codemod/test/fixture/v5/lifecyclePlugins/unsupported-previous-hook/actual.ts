import * as fc from 'fast-check';

// A conditional call can skip the earlier hook at runtime.
fc.assert(
  fc.property(fc.integer(), Number.isInteger).beforeEach((previous) => {
    if (enabled) previous();
  }),
);
