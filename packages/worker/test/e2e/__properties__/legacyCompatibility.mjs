import { strict as assert } from 'node:assert';
import { isMainThread } from 'node:worker_threads';
import * as fc from 'fast-check';
import { assert as assertProperty, propertyFor } from '@fast-check/worker';

for (const randomSource of ['main-thread', 'worker']) {
  const property = propertyFor(new URL(import.meta.url), { randomSource, isolationLevel: 'property' });
  const passing = property(fc.integer(), async (value) => {
    await Promise.resolve();
    assert.equal(typeof value, 'number');
  });
  const failing = property(fc.constant('counterexample'), async () => {
    await Promise.resolve();
    throw new Error('legacy predicate failure');
  });

  if (isMainThread) {
    await assertProperty(passing, { seed: 42, numRuns: 3 });
    await assert.rejects(assertProperty(failing, { seed: 42, numRuns: 1 }), (error) => {
      assert.match(error.message, /Counterexample: \["counterexample"\]/);
      assert.match(error.message, /Shrunk 0 time\(s\)/);
      assert.match(String(error.cause), /legacy predicate failure/);
      return true;
    });
  }
}

const property = propertyFor(new URL(import.meta.url), { randomSource: 'worker' });
const nonSerializable = property(
  fc.integer().map((value) => Symbol.for(String(value))),
  async (value) => {
    await Promise.resolve();
    assert.equal(typeof value, 'symbol');
  },
);

if (isMainThread) {
  await assertProperty(nonSerializable, { seed: 42, numRuns: 3 });
}
