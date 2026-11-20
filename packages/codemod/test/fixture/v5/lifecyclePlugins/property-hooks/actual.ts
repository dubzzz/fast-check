import * as fc from 'fast-check';
function setUp() {
  reset();
}
function tearDown() {
  cleanup();
}
fc.assert(fc.property(arb, predicate).beforeEach(setUp).afterEach(tearDown), { numRuns: 3 });
fc.check(fc.asyncProperty(arb, asyncPredicate).afterEach(async () => cleanupAsync()));
fc.assert(
  fc.property(arb, predicate).beforeEach(() => calls.push('start')),
  { plugins: [fc.timeout(15)] },
);
fc.check(fc.property(arb, predicate).afterEach(tearDown), {
  plugins: [...(flag ? [fc.unbiased()] : [])],
});
