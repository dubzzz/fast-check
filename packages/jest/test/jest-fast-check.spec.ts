import { describe, it, expect } from 'vitest';
import type * as _fc from 'fast-check';
import type { test as _test, it as _it } from '@fast-check/jest';
import type { jest as _jest, expect as _jestExpect } from '@jest/globals';
import {
  writeToFile,
  runSpec,
  expectPass,
  expectFail,
  expectAlignedSeeds,
  expectTimeout,
} from './__test-helpers__/RunJest.js';
import { runOptions } from './__test-helpers__/RunOptions.js';

declare const fc: typeof _fc;
declare const runner: typeof _test | typeof _it;
declare const jest: typeof _jest;
declare const jestExpect: typeof _jestExpect;

describe.each(runOptions)('$specName', ({ runnerName, useWorkers, testRunner }) => {
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

  if (useWorkers) {
    it.concurrent('should fail on property blocking the main thread', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()], { timeout: 500 })('property block main thread', () => {
          while (true);
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expect(out).toMatch(/[×✕] property block main thread/);
    });
  }

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

  describe('.skip', () => {
    it.concurrent('should never be executed', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.skip.prop([fc.constant(null)])('property never executed', (_unused) => false);
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expect(out).toMatch(/Test Suites:\s+1 skipped, 0 of 1 total/);
      expect(out).toMatch(/Tests:\s+1 skipped, 1 total/);
    });
  });

  if (testRunner === undefined) {
    describe('.failing', () => {
      it.concurrent('should fail on successful no prop mode', async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, options, () => {
          runner.failing('successful no prop', () => {
            jestExpect(true).toBe(true);
          });
        });

        // Act
        const out = await runSpec(specDirectory);

        // Assert
        expectFail(out);
        expect(out).toMatch(/[×✕] successful no prop/);
      });

      it.concurrent('should pass on failing no prop mode', async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, options, () => {
          runner.failing('failing no prop', () => {
            jestExpect(false).toBe(true);
          });
        });

        // Act
        const out = await runSpec(specDirectory);

        // Assert
        expectPass(out);
        expect(out).toMatch(/[√✓] failing no prop/);
      });

      it.concurrent('should pass because failing', async () => {
        // Arrange
        const specDirectory = await writeToFile(runnerName, options, () => {
          runner.failing.prop([fc.constant(null)])('property pass because failing', async (_unused) => false);
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
          runner.failing.prop([fc.constant(null)])('property fail because passing', async (_unused) => true);
        });

        // Act
        const out = await runSpec(specDirectory);

        // Assert
        expectFail(out);
        expect(out).toMatch(/[×✕] property fail because passing \(with seed=-?\d+\)/);
      });
    });
  }

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

  describe('timeout', () => {
    it.concurrent('should fail as test takes longer than global Jest timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()])('property takes longer than global Jest timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 5000);
      expect(out).toMatch(/[×✕] property takes longer than global Jest timeout/);
    });

    it.concurrent('should fail as test takes longer than Jest local timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()])(
          'property takes longer than Jest local timeout',
          async () => {
            await new Promise(() => {}); // never resolving
          },
          1000,
        );
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest local timeout/);
    });

    it.concurrent('should fail as test takes longer than Jest config timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, { ...options, testTimeoutConfig: 1000 }, () => {
        runner.prop([fc.nat()])('property takes longer than Jest config timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest config timeout/);
    });

    it.concurrent('should fail as test takes longer than Jest setTimeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        if (typeof jest !== 'undefined') {
          jest.setTimeout(1000);
        }
        runner.prop([fc.nat()])('property takes longer than Jest setTimeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest setTimeout/);
    });

    it.concurrent('should fail as test takes longer than Jest CLI timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        runner.prop([fc.nat()])('property takes longer than Jest CLI timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory, { testTimeoutCLI: 1000 });

      // Assert
      expectFail(out);
      expectTimeout(out, 1000);
      expect(out).toMatch(/[×✕] property takes longer than Jest CLI timeout/);
    });

    it.concurrent('should fail but favor local Jest timeout over Jest setTimeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        if (typeof jest !== 'undefined') {
          jest.setTimeout(3000);
        }
        runner.prop([fc.nat()])(
          'property favor local Jest timeout over Jest setTimeout',
          async () => {
            await new Promise(() => {}); // never resolving
          },
          1000,
        );
      });

      // Act
      const out = await runSpec(specDirectory);

      // Assert
      expectFail(out);
      expectTimeout(out, 1000); // neither 3000 (setTimeout), nor 5000 (default)
      expect(out).toMatch(/[×✕] property favor local Jest timeout over Jest setTimeout/);
    });

    it.concurrent('should fail but favor Jest setTimeout over Jest CLI timeout', async () => {
      // Arrange
      const specDirectory = await writeToFile(runnerName, options, () => {
        if (typeof jest !== 'undefined') {
          jest.setTimeout(1000);
        }
        runner.prop([fc.nat()])('property favor Jest setTimeout over Jest CLI timeout', async () => {
          await new Promise(() => {}); // never resolving
        });
      });

      // Act
      const out = await runSpec(specDirectory, { testTimeoutCLI: 3000 });

      // Assert
      expectFail(out);
      expectTimeout(out, 1000); // neither 3000 (cli), nor 5000 (default)
      expect(out).toMatch(/[×✕] property favor Jest setTimeout over Jest CLI timeout/);
    });
  });
});
