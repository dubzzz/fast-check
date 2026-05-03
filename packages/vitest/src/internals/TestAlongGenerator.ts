import type { TestAPI, TestFunction, TestOptions } from 'vitest';
import type { Arbitrary, GeneratorValue, Parameters } from 'fast-check';
import type { ExtraContext } from './types.js';

import { TestRunner } from 'vitest';
import { assert, asyncProperty, gen, readConfigureGlobal } from 'fast-check';
import { functionNeedsG, readNumRunsOverride } from './FuzzMode.js';

type TestCollectorOptions = Omit<TestOptions, 'shuffle'>;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type Sig1 = [name: string | Function, fn: TestFunction<ExtraContext>, options: TestCollectorOptions];
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type Sig2 = [name: string | Function, fn?: TestFunction<ExtraContext>, options?: number | TestOptions];
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type Sig3 = [name: string | Function, options?: TestCollectorOptions, fn?: TestFunction<ExtraContext>];

function isSig1OrSig2(args: Sig1 | Sig2 | Sig3): args is Sig1 | Sig2 {
  return typeof args[1] === 'function' || (args[1] === undefined && args[2] === undefined);
}

function taskCollectorBuilder(this: any, ...args: Sig1 | Sig2 | Sig3) {
  const [name, fn, options] = isSig1OrSig2(args) ? args : [args[0], args[2], args[1]];
  const taskName = typeof name === 'function' ? name.name : name;
  const taskOptions = {
    ...this,
    ...(typeof options === 'number' ? { timeout: options } : options),
  };

  if (fn === undefined || !functionNeedsG(fn)) {
    TestRunner.getCurrentSuite().task(taskName, {
      ...taskOptions,
      handler: fn as any,
    });
    return;
  }

  TestRunner.getCurrentSuite().task(taskName, {
    ...taskOptions,
    handler: async (context) => {
      const config = readConfigureGlobal();
      const numRunsOverride = readNumRunsOverride();
      const parameters: Parameters<unknown> = {
        numRuns: numRunsOverride ?? config.numRuns ?? 1,
        endOnFailure: config.endOnFailure ?? true,
        includeErrorInReport: false,
        // @ts-expect-error - Added for backward compatibility with fast-check@3
        errorWithCause: true,
      };
      await assert(
        asyncProperty(gen(), (g) => {
          const refinedG: GeneratorValue = Object.assign(
            <T, TArgs extends unknown[]>(arb: (...params: TArgs) => Arbitrary<T>, ...args: TArgs): T =>
              g(arb, ...args),
            { values: () => g.values() },
          );
          return fn({ ...context, g: refinedG });
        }),
        parameters,
      );
    },
  });
}

export const testAPIRefined: TestAPI<ExtraContext> = TestRunner.createTaskCollector(
  taskCollectorBuilder,
) as TestAPI<ExtraContext>;
