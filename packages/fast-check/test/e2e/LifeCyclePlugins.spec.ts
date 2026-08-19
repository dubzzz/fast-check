import { describe, expect, it } from 'vitest';
import * as fc from '../../src/fast-check.js';
import { seed } from './seed.js';

describe(`LifeCyclePlugins (seed: ${seed})`, () => {
  it('should order life-cycle plugins as documented: before in declaration order and after in the reversed way', async () => {
    // Arrange
    const probes: string[] = [];

    // Act
    await fc.assert(
      fc.asyncProperty(fc.integer(), async (_x) => {
        probes.push('predicate');
        return true;
      }),
      {
        plugins: [
          fc.beforeEach(() => {
            probes.push('beforeEach #1');
          }),
          fc.beforeEach(() => {
            probes.push('beforeEach #2');
          }),
          fc.afterEach(() => {
            probes.push('afterEach #3');
          }),
          fc.afterEach(() => {
            probes.push('afterEach #4');
          }),
          fc.beforeEach(() => {
            probes.push('beforeEach #5');
          }),
        ],
        numRuns: 2,
      },
    );

    // Assert
    expect(probes).toEqual([
      // 1st run
      'beforeEach #1',
      'beforeEach #2',
      'beforeEach #5',
      'predicate',
      'afterEach #4',
      'afterEach #3',
      // 2nd run
      'beforeEach #1',
      'beforeEach #2',
      'beforeEach #5',
      'predicate',
      'afterEach #4',
      'afterEach #3',
    ]);
  });
});
