import { describe, expect, it } from 'vitest';
import * as fc from '../src/fast-check.js';
import { readInstalledGlobalPlugins } from '../src/check/runner/configuration/GlobalPlugins.js';
import { seed } from './seed.js';

describe(`Ticks (seed: ${seed})`, () => {
  it.each([{ kind: 'sync' as const }, { kind: 'async' as const }])(
    'should minimize microtask overhead when running $kind predicate',
    async ({ kind }) => {
      // Arrange
      expect(readInstalledGlobalPlugins()).toHaveLength(0);
      using clock = startMicroTaskClock();
      const numRuns = 10;
      const { startupTicks, ticksPerRun, chainSettlementTicksPerTransition, fixedCompletionTicks } =
        extractExpectedTicks(kind);

      // Act
      let firstPredicateRunTick: number | undefined = undefined;
      let lastPredicateRunTick: number | undefined = undefined;
      await fc.assert(
        fc.property(fc.integer(), (_value) => {
          firstPredicateRunTick ??= clock.tick;
          lastPredicateRunTick = clock.tick;
          return kind === 'async' ? Promise.resolve() : undefined;
        }),
        { numRuns },
      );
      const assertionCompletionTick = clock.tick;

      // Assert
      expect({ firstPredicateRunTick, lastPredicateRunTick, assertionCompletionTick }).toEqual({
        firstPredicateRunTick: startupTicks,
        lastPredicateRunTick: firstPredicateRunTick! + (numRuns - 1) * ticksPerRun,
        assertionCompletionTick:
          firstPredicateRunTick! +
          numRuns * ticksPerRun +
          (numRuns - 1) * chainSettlementTicksPerTransition +
          fixedCompletionTicks,
      });
    },
  );
});

// Helpers

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
      chainSettlementTicksPerTransition: 0, // No extra tick for the final settlement
      fixedCompletionTicks: 2, // One tick runs assert's reportRunDetails callback, another resumes the it's await
    };
  }
  return {
    startupTicks: 0, // The runner invokes the first predicate before yielding to any microtask
    ticksPerRun: 2, // 2 ticks per run: PropertyImplem.run converts the predicate result in one promise callback, propertyRunner handles it in the next
    chainSettlementTicksPerTransition: 1, // One tick to propagate settlement to the enclosing promise
    fixedCompletionTicks: 3, // check, assert and the it's await each add one tick
  };
}
