import { describe, it, expect } from 'vitest';
import type * as _fc from 'fast-check';
import type { test as _test, it as _it } from '@fast-check/jest';
import type { RunOptions } from './RunOptions.js';
import { writeToFile, runSpec, expectPass, expectFail, expectAlignedSeeds } from './RunJest.js';

declare const fc: typeof _fc;
declare const runner: typeof _test | typeof _it;

export function buildModifierConcurrentSpecsFor(runOptions: RunOptions): void {
  const { runnerName, testRunner, useWorkers } = runOptions;
  const options = { useWorkers, testRunner };

  describe('.concurrent', () => {
    it.concurrent('should pass on truthy property', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.concurrent.prop([fc.constant(null)])('property pass on truthy property', (_unused) => true);
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectPass(out);
      expect(out).toMatch(/[√✓] property pass on truthy property \(with seed=-?\d+\)/);
    });

    it.concurrent('should fail on falsy property', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.concurrent.prop([fc.constant(null)])('property fail on falsy property', (_unused) => false);
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectAlignedSeeds(out);
      expect(out).toMatch(/[×✕] property fail on falsy property \(with seed=-?\d+\)/);
    });

    if (testRunner === undefined) {
      describe('.failing', () => {
        it.concurrent('should pass because failing', async () => {
          // Arrange
          const specDirectory = await writeToFile(runnerName, options, () => {
            runner.concurrent.failing.prop([fc.constant(null)])(
              'property pass because failing',
              async (_unused) => false,
            );
          });

          // Act
          const out = await runSpec(specDirectory);

          // Assert
          expectPass(out);
          expect(out).toMatch(/[√✓] property pass because failing \(with seed=-?\d+\)/);
        });

        it.concurrent('should fail because passing', async () => {
          // Arrange
          const specDirectory = await writeToFile(runnerName, options, () => {
            runner.concurrent.failing.prop([fc.constant(null)])(
              'property fail because passing',
              async (_unused) => true,
            );
          });

          // Act
          const out = await runSpec(specDirectory);

          // Assert
          expectFail(out);
          expect(out).toMatch(/[×✕] property fail because passing \(with seed=-?\d+\)/);
        });
      });
    }
  });
}
