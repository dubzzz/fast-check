const assert = require('node:assert/strict');

module.exports = async function checkCompatibility(fc) {
  const integers = fc.integer({ min: 1, max: 100 });
  const shrinks = integers.shrink(100, undefined);
  assert.ok(shrinks instanceof Iterator);
  assert.deepEqual(
    shrinks
      .map((value) => value.value)
      .take(1)
      .toArray(),
    [1],
  );

  let details;
  await assert.rejects(
    fc.assert(
      fc.property(integers, () => false),
      {
        seed: 42,
        examples: [[100]],
        plugins: [
          () => ({
            onAllRunsComplete: (runDetails) => {
              details = runDetails;
            },
          }),
        ],
      },
    ),
    /Property failed/,
  );
  assert.deepEqual(details.counterexample, [1]);
  assert.ok(details.numShrinks > 0);

  // Two timeout plugins exercise AbortSignal.any as well as timers and performance.now.
  let signal;
  await assert.rejects(
    fc.assert(
      fc.property(fc.constant(null), (_value, context) => {
        signal = context.signal;
        return new Promise(() => {
          // The timeout must finish the run even when the predicate never settles.
        });
      }),
      { numRuns: 1, plugins: [fc.timeout(10), fc.timeout(10_000)] },
    ),
    (error) => {
      assert.ok(error.cause instanceof Error);
      assert.match(error.cause.message, /Property timeout/);
      return true;
    },
  );
  assert.ok(signal instanceof AbortSignal);
  assert.equal(signal.aborted, true);
  assert.match(signal.reason.message, /Property timeout/);
};
