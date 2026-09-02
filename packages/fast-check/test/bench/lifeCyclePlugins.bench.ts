import { describe, bench } from 'vitest';
import { fc } from './__test-helpers__/Imports.js';

// Hooks increment a counter so that no hook body can be considered dead-code
let counter = 0;

function syncOnlyPlugins() {
  return [
    fc.beforeEach(() => {
      counter += 1;
    }),
    fc.beforeEach(() => {
      counter += 1;
      return () => {
        counter += 1;
      };
    }),
    fc.afterEach(() => {
      counter += 1;
    }),
    fc.afterEach(() => {
      counter += 1;
    }),
  ];
}

function asyncThenSyncOnlyPlugins() {
  return [
    // oxlint-disable-next-line typescript/require-await
    fc.beforeEach(async () => {
      counter += 1;
    }),
    ...syncOnlyPlugins(),
  ];
}

function asyncOnlyPlugins() {
  return [
    // oxlint-disable-next-line typescript/require-await
    fc.beforeEach(async () => {
      counter += 1;
      // oxlint-disable-next-line typescript/require-await
      return async () => {
        counter += 1;
      };
    }),
    // oxlint-disable-next-line typescript/require-await
    fc.afterEach(async () => {
      counter += 1;
    }),
  ];
}

// Longer sampling than the default to reduce the impact of the noise of the machine
const benchOptions = { warmupTime: 300, time: 1500 };

// Benchmark
describe('life-cycle plugins', () => {
  bench(
    'async property without any hook',
    () => {
      // oxlint-disable-next-line typescript/require-await
      return fc.assert(fc.asyncProperty(fc.constant(1), async (_c) => true));
    },
    benchOptions,
  );
  bench(
    'sync property with sync-only hooks',
    () => {
      fc.assert(
        fc.property(fc.constant(1), (_c) => true),
        { plugins: syncOnlyPlugins() },
      );
    },
    benchOptions,
  );
  bench(
    'async property with sync-only hooks',
    () => {
      return fc.assert(
        // oxlint-disable-next-line typescript/require-await
        fc.asyncProperty(fc.constant(1), async (_c) => true),
        { plugins: syncOnlyPlugins() },
      );
    },
    benchOptions,
  );
  bench(
    'async property with an async beforeEach followed by sync-only hooks',
    () => {
      return fc.assert(
        // oxlint-disable-next-line typescript/require-await
        fc.asyncProperty(fc.constant(1), async (_c) => true),
        { plugins: asyncThenSyncOnlyPlugins() },
      );
    },
    benchOptions,
  );
  bench(
    'async property with async-only hooks',
    () => {
      return fc.assert(
        // oxlint-disable-next-line typescript/require-await
        fc.asyncProperty(fc.constant(1), async (_c) => true),
        { plugins: asyncOnlyPlugins() },
      );
    },
    benchOptions,
  );
});
