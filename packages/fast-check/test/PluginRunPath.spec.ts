import { describe, expect, it } from 'vitest';
import * as fc from '../src/fast-check.js';
import { seed } from './seed.js';

type RunMode = 'synchronous' | 'asynchronous' | 'mixed';
type ObservedRun = { value: number; path: string | undefined };

describe.each<RunMode>(['synchronous', 'asynchronous', 'mixed'])('Plugin run paths (%s)', (mode) => {
  it.each([
    { path: '', expectedPaths: ['0', '1', '2', '3'] },
    { path: '3', expectedPaths: ['3', '4', '5'] },
  ])('should count skipped examples when starting at "$path"', async ({ path, expectedPaths }) => {
    // Arrange
    const runs: ObservedRun[] = [];
    const examples: [number][] = [[0], [1], [2], [3], [4], [5]];

    // Act
    await fc.assert(
      fc.property(fc.integer(), (value) => {
        fc.pre(value % 2 !== 0);
      }),
      {
        seed,
        path,
        numRuns: 2,
        examples,
        plugins: [recordRuns(runs, mode)],
      },
    );

    // Assert
    expect(runs.map((run) => run.path)).toEqual(expectedPaths);
  });

  it('should expose replayable paths for generated values after examples', async () => {
    // Arrange
    const runs: ObservedRun[] = [];
    const arbitrary = fc.integer();
    const examples: [number][] = [[42]];

    // Act
    await fc.assert(
      fc.property(arbitrary, () => true),
      {
        seed,
        examples,
        numRuns: 3,
        plugins: [recordRuns(runs, mode)],
      },
    );

    // Assert
    expect(runs.map((run) => run.path)).toEqual(['0', '1', '2']);
    for (const run of runs) {
      const replayedRuns: ObservedRun[] = [];
      await fc.assert(
        fc.property(arbitrary, () => false),
        {
          seed,
          examples,
          path: run.path,
          endOnFailure: true,
          noDefaultPlugins: true,
          plugins: [recordRuns(replayedRuns, mode)],
        },
      );
      expect(replayedRuns).toEqual([run]);
    }
  });

  it.each(['', '2', '2:1', '2:1:0'])(
    'should expose replayable paths for every execution when starting at "%s"',
    async (path) => {
      // Arrange
      const runs: ObservedRun[] = [];
      const predicateRuns: ObservedRun[] = [];
      const arbitrary = fc.integer({ min: 0, max: 100 });
      const examples: [number][] = [[0], [1], [42]];
      let details: fc.RunDetails<[number]> | undefined;

      // Act
      await fc.assert(
        fc.property(arbitrary, (value, context) => {
          predicateRuns.push({ value, path: context.path });
          fc.pre(value !== 0);
          return value < 5;
        }),
        {
          seed,
          path,
          examples,
          numRuns: 2,
          noDefaultPlugins: true,
          plugins: [
            recordRuns(runs, mode),
            () => ({
              onAllRunsComplete: (runDetails) => {
                details = runDetails;
              },
            }),
          ],
        },
      );

      // Assert
      expect(details).toMatchObject({ failed: true, counterexample: [5] });
      expect(runs.some((run) => run.path?.includes(':'))).toBe(true);
      expect(predicateRuns).toEqual(runs);
      expect(details?.counterexamplePath).toBe(runs.findLast((run) => run.value >= 5)?.path);
      for (const run of runs) {
        expect(run.path).toBeTypeOf('string');
        const replayedRuns: ObservedRun[] = [];
        await fc.assert(
          fc.property(arbitrary, () => false),
          {
            seed,
            path: run.path,
            examples,
            endOnFailure: true,
            noDefaultPlugins: true,
            plugins: [recordRuns(replayedRuns, mode)],
          },
        );
        expect(replayedRuns).toEqual([run]);
      }
    },
  );

  it('should preserve paths through plugins that copy the execution context or retry the predicate', async () => {
    // Arrange
    const outerRuns: ObservedRun[] = [];
    const innerRuns: ObservedRun[] = [];
    const predicatePaths: (string | undefined)[] = [];
    const signal = new AbortController().signal;

    // Act
    await fc.assert(
      fc.property(fc.integer(), (_value, context) => {
        predicatePaths.push(context.path);
      }),
      {
        numRuns: 2,
        plugins: [
          recordRuns(outerRuns, mode),
          () => ({
            decorateRun: (nestedRun) => async (value, context) => {
              const nextContext = { ...context, signal };
              await nestedRun(value, nextContext);
              return nestedRun(value, nextContext);
            },
          }),
          recordRuns(innerRuns, mode),
        ],
      },
    );

    // Assert
    expect(outerRuns.map((run) => run.path)).toEqual(['0', '1']);
    expect(innerRuns.map((run) => run.path)).toEqual(['0', '0', '1', '1']);
    expect(predicatePaths).toEqual(['0', '0', '1', '1']);
  });
});

// Helpers

function recordRuns(runs: ObservedRun[], mode: RunMode): fc.Plugin<[number]> {
  return () => ({
    decorateRun: (nestedRun) => (value, context) => {
      runs.push({ value: value[0], path: context.path });
      const out = nestedRun(value, context);
      return mode === 'asynchronous' || (mode === 'mixed' && runs.length % 2 === 0) ? Promise.resolve(out) : out;
    },
  });
}
