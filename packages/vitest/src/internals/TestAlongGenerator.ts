import type { TestAPI, TestFunction, TestOptions } from 'vitest';
import type { Arbitrary, GeneratorValue, Parameters } from 'fast-check';
import type { ExtraContext } from './types.js';

import { createTaskCollector, getCurrentSuite } from 'vitest/suite';
import { assert, asyncProperty, gen, readConfigureGlobal } from 'fast-check';

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
  getCurrentSuite().task(taskName, {
    ...this,
    ...(typeof options === 'number' ? { timeout: options } : options),
    handler:
      fn !== undefined
        ? async (context) => {
            let calledOnce = false;
            const config = readConfigureGlobal();
            try {
              const parameters: Parameters<unknown> = {
                // Remark: We should turn it back to 1 in case g never gets called by the first execution of the predicate
                numRuns: config.numRuns ?? 1,
                endOnFailure: config.endOnFailure ?? true,
                includeErrorInReport: false,
                // @ts-expect-error - Added for backward compatility with fast-check@3
                errorWithCause: true,
              };
              await assert(
                asyncProperty(gen(), (g) => {
                  const refinedG: GeneratorValue = Object.assign(
                    <T, TArgs extends unknown[]>(arb: (...params: TArgs) => Arbitrary<T>, ...args: TArgs): T => {
                      calledOnce = true;
                      return g(arb, ...args);
                    },
                    { values: () => g.values() },
                  );
                  return fn({ ...context, g: refinedG });
                }),
                parameters,
              );
            } catch (error) {
              if (calledOnce) {
                throw error;
              }
              throw (error as { cause?: unknown }).cause;
            }
          }
        : undefined,
  });
}

export const testAPIRefined: TestAPI<ExtraContext> = createTaskCollector(taskCollectorBuilder) as TestAPI<ExtraContext>;
