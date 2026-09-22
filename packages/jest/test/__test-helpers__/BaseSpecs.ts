import { it, expect } from 'vitest';
import type * as _fc from 'fast-check';
import type { test as _test, it as _it } from '@fast-check/jest';
import type { expect as _jestExpect } from '@jest/globals';
import type { RunOptions } from './RunOptions.js';
import { writeToFile, runSpec, expectPass, expectFail, expectAlignedSeeds } from './RunJest.js';

declare const fc: typeof _fc;
declare const runner: typeof _test | typeof _it;
declare const jestExpect: typeof _jestExpect;

export function buildBaseSpecsFor(runOptions: RunOptions): void {
  const { runnerName, testRunner, useWorkers } = runOptions;
  const options = { useWorkers, testRunner };

  it.concurrent('should pass on successful no prop mode', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner('successful no prop', () => {
        jestExpect(true).toBe(true);
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectPass(out);
    expect(out).toMatch(/[√✓] successful no prop/);
  });

  it.concurrent('should fail on failing no prop mode', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner('failing no prop', () => {
        jestExpect(false).toBe(true);
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectFail(out);
    expect(out).toMatch(/[×✕] failing no prop/);
  });

  it.concurrent('should pass on truthy synchronous property', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop([fc.string(), fc.string(), fc.string()])('property pass sync', (a, b, c) => {
        return `${a}${b}${c}`.includes(b);
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectPass(out);
    expect(out).toMatch(/[√✓] property pass sync \(with seed=-?\d+\)/);
  });

  it.concurrent('should pass on truthy asynchronous property', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop([fc.string(), fc.string(), fc.string()])('property pass async', async (a, b, c) => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        return `${a}${b}${c}`.includes(b);
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectPass(out);
    expect(out).toMatch(/[√✓] property pass async \(with seed=-?\d+\)/);
  });

  it.concurrent('should fail on falsy synchronous property', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop([fc.nat()])('property fail sync', (a) => {
        return a === 0;
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectFail(out);
    expectAlignedSeeds(out);
    expect(out).toMatch(/[×✕] property fail sync \(with seed=-?\d+\)/);
  });

  it.concurrent('should fail on falsy asynchronous property', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop([fc.nat()])('property fail async', async (a) => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        return a === 0;
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectFail(out);
    expectAlignedSeeds(out);
    expect(out).toMatch(/[×✕] property fail async \(with seed=-?\d+\)/);
  });

  it.concurrent('should pass on truthy record-based property', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop({ a: fc.string(), b: fc.string(), c: fc.string() })('property pass record', ({ a, b, c }) => {
        jestExpect(typeof a).toBe('string');
        jestExpect(typeof b).toBe('string');
        jestExpect(typeof c).toBe('string');
        return `${a}${b}${c}`.includes(b);
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectPass(out);
    expect(out).toMatch(/[√✓] property pass record \(with seed=-?\d+\)/);
  });

  it.concurrent('should fail on falsy record-based property', async () => {
    // Arrange
    const specDirectory = await writeToFile(runnerName, options, () => {
      runner.prop({ a: fc.string(), b: fc.string(), c: fc.string() })('property fail record', ({ a, b, c }) => {
        return `${a}${b}${c}`.includes(`${b}!`);
      });
    });

    // Act
    const out = await runSpec(specDirectory);

    // Assert
    expectFail(out);
    expectAlignedSeeds(out);
    expect(out).toMatch(/[×✕] property fail record \(with seed=-?\d+\)/);
  });
}
