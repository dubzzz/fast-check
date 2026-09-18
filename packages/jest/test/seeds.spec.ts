import { describe, it, expect } from 'vitest';
import type * as _fc from 'fast-check';
import type { test as _test, it as _it } from '@fast-check/jest';
import { writeToFile, runSpec, expectFail, expectAlignedSeeds } from './__test-helpers__/RunJest.js';
import { runOptions } from './__test-helpers__/RunOptions.js';

declare const fc: typeof _fc;
declare const runner: typeof _test | typeof _it;

describe.each(runOptions)('$specName', ({ runnerName, useWorkers, testRunner }) => {
  const options = { useWorkers, testRunner };

  it.concurrent('should fail on falsy record-based property with seed', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop({ a: fc.string(), b: fc.string(), c: fc.string() }, { seed: 4869 })(
        'property fail record seeded',
        (_unused) => false,
      );
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectFail(out);
    expectAlignedSeeds(out, { noAlignWithJest: true });
    expect(out).toMatch(/[×✕] property fail record seeded \(with seed=4869\)/);
  });

  it.concurrent('should fail with locally requested seed', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop([fc.constant(null)], { seed: 4242 })('property fail with locally requested seed', (_unused) => false);
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectFail(out);
    expectAlignedSeeds(out, { noAlignWithJest: true });
    expect(out).toMatch(/[×✕] property fail with locally requested seed \(with seed=4242\)/);
  });

  it.concurrent('should fail with globally requested seed', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      fc.configureGlobal({ seed: 4848 });
      runner.prop([fc.constant(null)])('property fail with globally requested seed', (_unused) => false);
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectFail(out);
    expectAlignedSeeds(out, { noAlignWithJest: true });
    expect(out).toMatch(/[×✕] property fail with globally requested seed \(with seed=4848\)/);
  });

  it.concurrent('should fail with seed requested at jest level', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop([fc.constant(null)])('property fail with globally requested seed', (_unused) => false);
    });

    // Act
    const out = await runSpec(specDirectory, { jestSeed: 6969 });

    // Assert
    expectFail(out);
    expectAlignedSeeds(out);
    expect(out).toMatch(/[×✕] property fail with globally requested seed \(with seed=6969\)/);
  });
});
