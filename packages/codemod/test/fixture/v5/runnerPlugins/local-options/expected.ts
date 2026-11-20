import * as fc from 'fast-check';
fc.assert(prop, {
  seed: 42,
  plugins: [other, fc.ignoreEqualValues(), fc.unbiased(), fc.timeout(500)]
});
fc.check(prop, {
  markInterruptAsFailure: true,

  plugins: [fc.skipEqualValues(), fc.interruptAfterTimeLimit(20, {
    failOnInterrupt: true
  })]
});
fc.assert(prop, { plugins: [...(enabled === true ? [fc.skipEqualValues()] : [])] });
fc.check(prop);
fc.assert(prop);
fc.check(prop, {
  seed: 42
});
fc.assert(prop, { plugins: [
  ...(limit !== void 0 ? [fc.timeout(limit > 2147483647 ? 2147483647 : limit)] : [])
] });
fc.assert(prop, { plugins: [fc.timeout(2147483647)] });
fc.assert(prop, {
  plugins: [fc.interruptAfterTimeLimit(30, {
    failOnInterrupt: true
  })]
});
fc.assert(prop, { markInterruptAsFailure: true, reporter: custom, plugins: [fc.interruptAfterTimeLimit(30, {
  failOnInterrupt: true
})] });
