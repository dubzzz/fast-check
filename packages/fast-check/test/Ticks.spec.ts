import { describe, expect, it } from 'vitest';
import * as fc from '../src/fast-check.js';
import { readInstalledGlobalPlugins } from '../src/check/runner/configuration/GlobalPlugins.js';
import { seed } from './seed.js';

describe.each([10, 100])(`Ticks (%i runs, seed: ${seed})`, (numRuns) => {
  it.each<{
    kind: 'sync' | 'async';
    plugins: fc.UniversalPlugin[];
    extraTicks: Partial<ReturnType<typeof extractExpectedTicks>>;
    description: string;
  }>([
    {
      kind: 'sync',
      plugins: [],
      extraTicks: {},
      description: 'no plugins',
    },
    {
      kind: 'async',
      plugins: [],
      extraTicks: {},
      description: 'no plugins',
    },
    {
      kind: 'sync',
      plugins: [buildSyncPassThroughPlugin()],
      extraTicks: {},
      description: 'sync pass-through plugin',
    },
    {
      kind: 'async',
      plugins: [buildSyncPassThroughPlugin()],
      extraTicks: {},
      description: 'sync pass-through plugin',
    },
    {
      kind: 'sync',
      plugins: [buildPromiseReturningPassThroughPlugin()],
      extraTicks: {
        startupTicks: 0, // No extra delay before the first predicate
        ticksPerRun: 1, // 1 to handle the wrapped result
        fixedCompletionTicks: 5, // 2 hook continuations, 2 result propagations, 1 check continuation
      },
      description: 'Promise.resolve pass-through plugin',
    },
    {
      kind: 'async',
      plugins: [buildPromiseReturningPassThroughPlugin()],
      extraTicks: {
        startupTicks: 0, // No extra delay before the first predicate
        ticksPerRun: 0, // Promise.resolve reuses nestedRun's promise
        fixedCompletionTicks: 4, // 2 hook continuations, 2 result propagations
      },
      description: 'Promise.resolve pass-through plugin',
    },
    {
      kind: 'sync',
      plugins: [fc.beforeEach(() => {})],
      extraTicks: {}, // Synchronous results and cleanup stay inline
      description: 'sync beforeEach',
    },
    {
      kind: 'sync',
      plugins: [fc.beforeEach(() => () => {})],
      extraTicks: {}, // Synchronous results and cleanup stay inline
      description: 'sync beforeEach with sync cleanup',
    },
    {
      kind: 'sync',
      plugins: [fc.afterEach(() => {})],
      extraTicks: {}, // Synchronous results and cleanup stay inline
      description: 'sync afterEach',
    },
    {
      kind: 'async',
      plugins: [fc.beforeEach(async () => {})],
      extraTicks: {
        startupTicks: 2, // 1 to settle the hook, 1 to start the predicate
        ticksPerRun: 4, // 2 before-hook ticks, 1 result propagation, 1 after-hook check
        fixedCompletionTicks: -2, // -startupTicks: no next run to prepare
      },
      description: 'async beforeEach',
    },
    {
      kind: 'async',
      plugins: [fc.beforeEach(async () => {}), fc.beforeEach(async () => {})],
      extraTicks: {
        startupTicks: 5, // 1 for the first hook, 3 for the second, 1 to start the predicate
        ticksPerRun: 7, // 5 before-hook ticks, 1 result propagation, 1 after-hook check
        fixedCompletionTicks: -5, // -startupTicks: no next run to prepare
      },
      description: '2x async beforeEach',
    },
    {
      kind: 'async',
      plugins: [fc.afterEach(async () => {})],
      extraTicks: {
        startupTicks: 0, // No extra delay before the first predicate
        ticksPerRun: 5, // 1 after-hook check, 3 hook ticks, 1 result propagation
        fixedCompletionTicks: 0, // Cleanup is already counted per run
      },
      description: 'async afterEach',
    },
    {
      kind: 'async',
      plugins: [fc.afterEach(async () => {}), fc.afterEach(async () => {})],
      extraTicks: {
        startupTicks: 0, // No extra delay before the first predicate
        ticksPerRun: 8, // 1 after-hook check, 6 hook ticks, 1 result propagation
        fixedCompletionTicks: 0, // Cleanup is already counted per run
      },
      description: '2x async afterEach',
    },
    {
      kind: 'async',
      plugins: [fc.beforeEach(async () => async () => {})],
      extraTicks: {
        startupTicks: 2, // 1 to settle the hook, 1 to start the predicate
        ticksPerRun: 8, // 2 before-hook ticks, 1 result propagation, 5 cleanup ticks
        fixedCompletionTicks: -2, // -startupTicks: no next run to prepare
      },
      description: 'async beforeEach with async cleanup',
    },
    {
      kind: 'async',
      plugins: [fc.beforeEach(async () => async () => {}), fc.beforeEach(async () => async () => {})],
      extraTicks: {
        startupTicks: 5, // 1 for the first hook, 3 for the second, 1 to start the predicate
        ticksPerRun: 14, // 5 before-hook ticks, 1 result propagation, 8 cleanup ticks
        fixedCompletionTicks: -5, // -startupTicks: no next run to prepare
      },
      description: '2x async beforeEach with async cleanup',
    },
    {
      kind: 'sync',
      plugins: [fc.interruptAfterTimeLimit(60_000)],
      extraTicks: {}, // Synchronous results and cleanup stay inline
      description: 'interruptAfterTimeLimit',
    },
    {
      kind: 'async',
      plugins: [fc.interruptAfterTimeLimit(60_000)],
      extraTicks: {
        startupTicks: 0, // No extra delay before the first predicate
        ticksPerRun: 1, // 1 to settle Promise.race
        fixedCompletionTicks: 0, // Timer cleanup is synchronous
      },
      description: 'interruptAfterTimeLimit',
    },
    {
      kind: 'sync',
      plugins: [fc.timeout(60_000)],
      extraTicks: {}, // Synchronous results and cleanup stay inline
      description: 'timeout',
    },
    {
      kind: 'async',
      plugins: [fc.timeout(60_000)],
      extraTicks: {
        startupTicks: 0, // No extra delay before the first predicate
        ticksPerRun: 1, // 1 to settle Promise.race
        fixedCompletionTicks: 0, // Timer cleanup adds no awaited promise
      },
      description: 'timeout',
    },
    {
      kind: 'sync',
      plugins: [fc.ignoreEqualValues()],
      extraTicks: {}, // Synchronous cache updates stay inline
      description: 'ignoreEqualValues',
    },
    {
      kind: 'async',
      plugins: [fc.ignoreEqualValues()],
      extraTicks: {
        startupTicks: 0, // No extra delay before the first predicate
        ticksPerRun: 3, // 1 result continuation, 1 cache update, 1 promise propagation
        fixedCompletionTicks: 0, // No completion hooks
      },
      description: 'ignoreEqualValues',
    },
  ])(
    'should match expected tick counts for $kind predicates with $description',
    async ({ kind, plugins, extraTicks }) => {
      // Arrange
      expect(readInstalledGlobalPlugins()).toHaveLength(0);
      using clock = startMicroTaskClock();
      const defaultTicks = extractExpectedTicks(kind);
      const startupTicks = defaultTicks.startupTicks + (extraTicks.startupTicks ?? 0);
      const ticksPerRun = defaultTicks.ticksPerRun + (extraTicks.ticksPerRun ?? 0);
      const fixedCompletionTicks = defaultTicks.fixedCompletionTicks + (extraTicks.fixedCompletionTicks ?? 0);

      // Act
      let firstPredicateRunTick: number | undefined = undefined;
      let lastPredicateRunTick: number | undefined = undefined;
      let predicateRuns = 0;
      await fc.assert(
        fc.property(incrementalInteger(), (_value) => {
          predicateRuns += 1;
          firstPredicateRunTick ??= clock.tick;
          lastPredicateRunTick = clock.tick;
          return kind === 'async' ? Promise.resolve() : undefined;
        }),
        { numRuns, plugins },
      );
      const assertionCompletionTick = clock.tick;

      // Assert
      expect(predicateRuns).toBe(numRuns);
      expect({ firstPredicateRunTick, lastPredicateRunTick, assertionCompletionTick }).toEqual({
        firstPredicateRunTick: startupTicks,
        lastPredicateRunTick: firstPredicateRunTick! + (numRuns - 1) * ticksPerRun,
        assertionCompletionTick: firstPredicateRunTick! + numRuns * ticksPerRun + fixedCompletionTicks,
      });
    },
  );
});

// Helpers

function incrementalInteger(): fc.Arbitrary<number> {
  let nextValue = 0;
  return fc.constant(undefined).map(() => nextValue++);
}

function startMicroTaskClock() {
  let isMicrotaskClockStopped = false;
  let microtaskTick = 0;
  function scheduleNextMicrotaskTick() {
    Promise.resolve().then(() => {
      if (isMicrotaskClockStopped) {
        return;
      }
      microtaskTick += 1;
      scheduleNextMicrotaskTick();
    });
  }
  scheduleNextMicrotaskTick();

  return {
    get tick() {
      return microtaskTick;
    },
    [Symbol.dispose]() {
      isMicrotaskClockStopped = true;
    },
  };
}

function extractExpectedTicks(kind: 'async' | 'sync') {
  if (kind === 'sync') {
    return {
      startupTicks: 0, // The runner invokes the first predicate before yielding to any microtask
      ticksPerRun: 0, // Synchronous results are handled inline, so all predicate starts on the same tick
      fixedCompletionTicks: 2, // One tick runs assert's reportRunDetails callback, another resumes the it's await
    };
  }
  return {
    startupTicks: 0, // The runner invokes the first predicate before yielding to any microtask
    ticksPerRun: 2, // 1 to convert the predicate result, 1 to resume the runner
    fixedCompletionTicks: 3, // check, assert and the it's await each add one tick
  };
}

function buildSyncPassThroughPlugin(): fc.UniversalPlugin {
  return <Ts>(): Required<fc.PluginInstance<Ts>> => ({
    decorateGenerate: (nestedGenerate) => (mrng, runId) => nestedGenerate(mrng, runId),
    decorateRun: (nestedRun) => (v, executionContext) => nestedRun(v, executionContext),
    onAllRunsComplete: (_runDetails) => {},
    afterAll: () => {},
  });
}

function buildPromiseReturningPassThroughPlugin(): fc.UniversalPlugin {
  return <Ts>(): Required<fc.PluginInstance<Ts>> => ({
    decorateGenerate: (nestedGenerate) => (mrng, runId) => nestedGenerate(mrng, runId),
    // WARNING: not equivalent to `(nestedRun) => async (v, executionContext) => nestedRun(v, executionContext)` when considering ticks
    decorateRun: (nestedRun) => (v, executionContext) => Promise.resolve(nestedRun(v, executionContext)),
    onAllRunsComplete: (_runDetails) => Promise.resolve(),
    afterAll: () => Promise.resolve(),
  });
}
