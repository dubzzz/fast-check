import { describe, expect, it } from 'vitest';
import * as fc from '../../src/fast-check.js';
import { seed } from './seed.js';

describe(`UnbiasedPlugin (seed: ${seed})`, () => {
  it('should drop runIds from generate with the unbiased plugin', () => {
    // Arrange
    const seenRunIds: (number | undefined)[] = [];
    const observerPlugin: fc.Plugin<unknown> = () => {
      return {
        decorateGenerate: (nestedGenerate) => (mrng, runId) => {
          seenRunIds.push(runId);
          return nestedGenerate(mrng, runId);
        },
      };
    };

    // Act
    fc.assert(
      fc.property(fc.integer(), (_x) => true),
      { plugins: [fc.unbiased(), observerPlugin], numRuns: 3 },
    );

    // Assert
    expect(seenRunIds).toEqual([undefined, undefined, undefined]);
  });
});
