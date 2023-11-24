import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { char } from '../../../../src/arbitrary/char';
import type { IRawProperty } from '../../../../src/check/property/IRawProperty';
import { check, assert as rAssert } from '../../../../src/check/runner/Runner';
import type { Random } from '../../../../src/random/generator/Random';
import type { RunDetails } from '../../../../src/check/runner/reporter/RunDetails';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import { Stream } from '../../../../src/stream/Stream';
import { VerbosityLevel } from '../../../../src/check/runner/configuration/VerbosityLevel';

const MAX_NUM_RUNS = 1000;
describe('Runner', () => {
  describe('check', () => {
    it('Should throw if property is null', () => {
      expect(() => check(null as any as IRawProperty<unknown>)).toThrowError();
    });
    it('Should throw if property is not a property at all', () => {
      expect(() => check({} as IRawProperty<unknown>)).toThrowError();
    });
    it('Should throw if property is an Arbitrary', () => {
      expect(() => check(char() as any as IRawProperty<unknown>)).toThrowError();
    });
    it.each`
      isAsync
      ${false}
      ${true}
    `('Should throw if both reporter and asyncReporter are defined (isAsync: $isAsync)', ({ isAsync }) => {
      const p: IRawProperty<[number]> = {
        isAsync: () => isAsync,
        generate: () => new Value([0], undefined),
        shrink: () => Stream.nil(),
        runBeforeEach: () => {},
        run: () => null,
        runAfterEach: () => {},
      };
      expect(() => check(p, { reporter: () => {}, asyncReporter: async () => {} })).toThrowError();
    });
    it('Should not throw if reporter is specified on synchronous properties', () => {
      const p: IRawProperty<[number]> = {
        isAsync: () => false,
        generate: () => new Value([0], undefined),
        shrink: () => Stream.nil(),
        runBeforeEach: () => {},
        run: () => null,
        runAfterEach: () => {},
      };
      expect(() => check(p, { reporter: () => {} })).not.toThrowError();
    });
    it('Should not throw if reporter is specified on asynchronous properties', () => {
      const p: IRawProperty<[number]> = {
        isAsync: () => true,
        generate: () => new Value([0], undefined),
        shrink: () => Stream.nil(),
        runBeforeEach: () => {},
        run: () => null,
        runAfterEach: () => {},
      };
      expect(() => check(p, { reporter: () => {} })).not.toThrowError();
    });
    it('Should throw if asyncReporter is specified on synchronous properties', () => {
      const p: IRawProperty<[number]> = {
        isAsync: () => false,
        generate: () => new Value([0], undefined),
        shrink: () => Stream.nil(),
        runBeforeEach: () => {},
        run: () => null,
        runAfterEach: () => {},
      };
      expect(() => check(p, { asyncReporter: async () => {} })).toThrowError();
    });
    it('Should not throw if asyncReporter is specified on asynchronous properties', () => {
      const p: IRawProperty<[number]> = {
        isAsync: () => true,
        generate: () => new Value([0], undefined),
        shrink: () => Stream.nil(),
        runBeforeEach: () => {},
        run: () => null,
        runAfterEach: () => {},
      };
      expect(() => check(p, { asyncReporter: async () => {} })).not.toThrowError();
    });
    it('Should call the property 100 times by default (on success)', () => {
      let numCallsGenerate = 0;
      let numCallsRun = 0;
      const p: IRawProperty<[number]> = {
        isAsync: () => false,
        generate: () => {
          expect(numCallsRun).toEqual(numCallsGenerate); // called run before calling back
          ++numCallsGenerate;
          return new Value([numCallsGenerate] as [number], undefined);
        },
        shrink: () => Stream.nil(),
        runBeforeEach: () => {},
        run: (value: [number]) => {
          expect(value[0]).toEqual(numCallsGenerate); // called with previously generated value
          ++numCallsRun;
          return null;
        },
        runAfterEach: () => {},
      };
      const out = check(p) as RunDetails<[number]>;
      expect(numCallsGenerate).toEqual(100);
      expect(numCallsRun).toEqual(100);
      expect(out.failed).toBe(false);
    });
    it('Should call the property 100 times even when path provided (on success)', () => {
      let numCallsGenerate = 0;
      let numCallsRun = 0;
      const p: IRawProperty<[number]> = {
        isAsync: () => false,
        generate: () => {
          expect(numCallsRun).toEqual(numCallsGenerate); // called run before calling back
          ++numCallsGenerate;
          return new Value([numCallsGenerate] as [number], undefined);
        },
        shrink: () => Stream.nil(),
        runBeforeEach: () => {},
        run: (value: [number]) => {
          expect(value[0]).toEqual(numCallsGenerate); // called with previously generated value
          ++numCallsRun;
          return null;
        },
        runAfterEach: () => {},
      };
      const out = check(p, { path: '3002' }) as RunDetails<[number]>;
      expect(numCallsGenerate).toEqual(100);
      expect(numCallsRun).toEqual(100);
      expect(out.failed).toBe(false);
    });
    it('Should call the property on all shrunk values for path (on success)', () => {
      let numCallsGenerate = 0;
      let numCallsRun = 0;
      const p: IRawProperty<[number]> = {
        isAsync: () => false,
        generate: () => {
          ++numCallsGenerate;
          return new Value<[number]>([0], 'shrink-me');
        },
        shrink: (value) => {
          function* g() {
            if (value.context !== 'shrink-me') {
              return;
            }
            for (let i = 0; i !== 1234; ++i) {
              yield new Value<[number]>([0], undefined);
            }
          }
          return new Stream(g());
        },
        runBeforeEach: () => {},
        run: () => {
          ++numCallsRun;
          return null;
        },
        runAfterEach: () => {},
      };
      const out = check(p, { path: '3002:0' }) as RunDetails<[number]>;
      expect(numCallsGenerate).toEqual(1);
      expect(numCallsRun).toEqual(1234);
      expect(out.failed).toBe(false);
    });
    it('Should ignore precondition failure runs and generate another value', async () => {
      const gapsBetweenSuccessesArb = fc.array(fc.nat(10), { minLength: 100, maxLength: 100 });
      const successfulRunIdsArb = gapsBetweenSuccessesArb.map((gaps) =>
        gaps.reduce((prev: number[], cur: number) => {
          prev.push(prev.length === 0 ? cur : prev[prev.length - 1] + cur + 1);
          return prev;
        }, []),
      );
      await fc.assert(
        fc.asyncProperty(
          successfulRunIdsArb,
          fc.boolean(),
          fc.option(fc.nat(99)),
          async (successIds, isAsyncProp, failAtId) => {
            let numCallsGenerate = 0;
            let numCallsRun = 0;
            const p: IRawProperty<[number]> = {
              isAsync: () => isAsyncProp,
              generate: () => new Value([numCallsGenerate++] as [number], undefined),
              shrink: () => Stream.nil(),
              runBeforeEach: () => {},
              run: (value: [number]) => {
                ++numCallsRun;
                const successId = successIds.indexOf(value[0]);
                if (successId !== -1)
                  return successId === failAtId ? { error: new Error(), errorMessage: 'failed' } : null;
                return new PreconditionFailure();
              },
              runAfterEach: () => {},
            };
            const out = await check(p);
            if (failAtId == null) {
              const expectedGenerate = successIds[successIds.length - 1] + 1;
              const expectedSkips = expectedGenerate - 100;
              expect(numCallsGenerate).toEqual(expectedGenerate);
              expect(numCallsRun).toEqual(expectedGenerate);
              expect(out.numRuns).toEqual(100);
              expect(out.numSkips).toEqual(expectedSkips);
              expect(out.failed).toBe(false);
            } else {
              const expectedGenerate = successIds[failAtId] + 1;
              const expectedSkips = expectedGenerate - failAtId - 1;
              expect(numCallsGenerate).toEqual(expectedGenerate);
              expect(numCallsRun).toEqual(expectedGenerate);
              expect(out.numRuns).toEqual(failAtId + 1);
              expect(out.numSkips).toEqual(expectedSkips);
              expect(out.failed).toBe(true);
            }
          },
        ),
      );
    });
    it('Should fail on too many precondition failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.nat(1000).chain((v) => fc.record({ maxSkipsPerRun: fc.constant(v), onlySuccessId: fc.nat(2 * v + 1) })),
          fc.boolean(),
          async (settings, isAsyncProp) => {
            let numCallsGenerate = 0;
            let numPreconditionFailures = 0;
            const p: IRawProperty<[number]> = {
              isAsync: () => isAsyncProp,
              generate: () => new Value([numCallsGenerate++] as [number], undefined),
              shrink: () => Stream.nil(),
              runBeforeEach: () => {},
              run: (value: [number]) => {
                if (value[0] === settings.onlySuccessId) return null;
                ++numPreconditionFailures;
                return new PreconditionFailure();
              },
              runAfterEach: () => {},
            };
            const out = await check(p, { numRuns: 2, maxSkipsPerRun: settings.maxSkipsPerRun });
            const expectedSkips = 2 * settings.maxSkipsPerRun + 1;
            const expectedRuns = settings.onlySuccessId === expectedSkips ? 0 : 1;
            expect(out.numRuns).toEqual(expectedRuns);
            expect(numPreconditionFailures).toEqual(expectedSkips);
            expect(out.numSkips).toEqual(expectedSkips);
            expect(out.failed).toBe(true);
          },
        ),
      );
    });
    it('Should never call shrink on success', () => {
      let numCallsGenerate = 0;
      let numCallsRun = 0;
      const p: IRawProperty<[number]> = {
        isAsync: () => false,
        generate: () => {
          ++numCallsGenerate;
          return new Value([0], undefined);
        },
        shrink: () => {
          throw 'Not implemented';
        },
        runBeforeEach: () => {},
        run: (_value: [number]) => {
          ++numCallsRun;
          return null;
        },
        runAfterEach: () => {},
      };
      const out = check(p) as RunDetails<[number]>;
      expect(numCallsGenerate).toEqual(100);
      expect(numCallsRun).toEqual(100);
      expect(out.failed).toBe(false);
    });
    it('Should call the property 100 times by default (except on error)', () =>
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), fc.integer(), (num, seed) => {
          let numCallsGenerate = 0;
          let numCallsRun = 0;
          const p: IRawProperty<[number]> = {
            isAsync: () => false,
            generate: () => {
              ++numCallsGenerate;
              return new Value([0], undefined);
            },
            shrink: () => Stream.nil(),
            runBeforeEach: () => {},
            run: (_value: [number]) => {
              return ++numCallsRun < num ? null : { error: new Error(), errorMessage: 'error' };
            },
            runAfterEach: () => {},
          };
          const out = check(p, { seed: seed }) as RunDetails<[number]>;
          expect(numCallsGenerate).toEqual(num); // stopped generate at first failing run
          expect(numCallsRun).toEqual(num); //  no shrink for first failing run
          expect(out.failed).toBe(true);
          expect(out.numRuns).toEqual(num);
          expect(out.seed).toEqual(seed);
          return true;
        }),
      ));
    it('Should alter the number of runs when asked to', () =>
      fc.assert(
        fc.property(fc.nat(MAX_NUM_RUNS), (num) => {
          let numCallsGenerate = 0;
          let numCallsRun = 0;
          const p: IRawProperty<[number]> = {
            isAsync: () => false,
            generate: () => {
              ++numCallsGenerate;
              return new Value([0], undefined);
            },
            shrink: () => Stream.nil(),
            runBeforeEach: () => {},
            run: (_value: [number]) => {
              ++numCallsRun;
              return null;
            },
            runAfterEach: () => {},
          };
          const out = check(p, { numRuns: num }) as RunDetails<[number]>;
          expect(numCallsGenerate).toEqual(num);
          expect(numCallsRun).toEqual(num);
          expect(out.failed).toBe(false);
          return true;
        }),
      ));
    it('Should generate the same values given the same seeds', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const buildPropertyFor = function (runOn: number[]) {
            const p: IRawProperty<[number]> = {
              isAsync: () => false,
              generate: (rng: Random) => {
                return new Value([rng.nextInt()], undefined);
              },
              shrink: () => Stream.nil(),
              runBeforeEach: () => {},
              run: (value: [number]) => {
                runOn.push(value[0]);
                return null;
              },
              runAfterEach: () => {},
            };
            return p;
          };
          const data1: number[] = [];
          const data2: number[] = [];
          check(buildPropertyFor(data1), { seed: seed });
          check(buildPropertyFor(data2), { seed: seed });
          expect(data2).toEqual(data1);
          return true;
        }),
      ));
    it('Should never call shrink if endOnFailure', () => {
      const p: IRawProperty<[number]> = {
        isAsync: () => false,
        generate: () => {
          return new Value([0], undefined);
        },
        shrink: () => {
          throw 'Not implemented';
        },
        runBeforeEach: () => {},
        run: (_value: [number]) => {
          return { error: new Error(), errorMessage: 'failure' };
        },
        runAfterEach: () => {},
      };
      const out = check(p, { endOnFailure: true }) as RunDetails<[number]>;
      expect(out.failed).toBe(true);
      expect(out.numShrinks).toEqual(0);
    });
    it('Should compute values for path before removing shrink if endOnFailure', () => {
      const p: IRawProperty<[number]> = {
        isAsync: () => false,
        generate: () => {
          return new Value([0], undefined);
        },
        shrink: (value) => {
          if (value.value[0] !== 0) {
            throw 'Not implemented';
          }
          return Stream.of(new Value([42], undefined));
        },
        runBeforeEach: () => {},
        run: (value: [number]) => {
          return value[0] === 42 ? { error: new Error(), errorMessage: 'failure' } : null;
        },
        runAfterEach: () => {},
      };
      const out = check(p, { path: '0:0', endOnFailure: true }) as RunDetails<[number]>;
      expect(out.failed).toBe(true);
      expect(out.numShrinks).toEqual(0);
    });
    it('Should not provide list of failures by default (no verbose)', () => {
      const p: IRawProperty<[number]> = {
        isAsync: () => false,
        generate: () => new Value([42], undefined),
        shrink: () => Stream.nil(),
        runBeforeEach: () => {},
        run: () => ({ error: new Error(), errorMessage: 'failure' }),
        runAfterEach: () => {},
      };
      const out = check(p) as RunDetails<[number]>;
      expect(out.failures).toHaveLength(0);
    });
    it('Should provide the list of failures in verbose mode', () => {
      const p: IRawProperty<[number]> = {
        isAsync: () => false,
        generate: () => new Value([42], undefined),
        shrink: (value) => {
          return value.value[0] === 42
            ? Stream.of(new Value([48], undefined), new Value([12], undefined))
            : Stream.nil();
        },
        runBeforeEach: () => {},
        run: () => ({ error: new Error(), errorMessage: 'failure' }),
        runAfterEach: () => {},
      };
      const out = check(p, { verbose: true }) as RunDetails<[number]>;
      expect(out.failures).not.toHaveLength(0);
      expect(out.failures).toEqual([[42], [48]]);
    });
    it('Should build the right counterexamplePath', () =>
      fc.assert(
        fc.property(fc.integer(), fc.array(fc.nat(99), { minLength: 1, maxLength: 100 }), (seed, failurePoints) => {
          // Each entry (at index idx) in failurePoints represents the number of runs
          // required before failing for the level <idx>
          // Basically it must fail before the end of the execution (100 runs by default)
          // so failure points are between 0 and 99 inclusive

          let idx = 0;
          let remainingBeforeFailure = failurePoints[idx];
          const p: IRawProperty<[number]> = {
            isAsync: () => false,
            generate: (_mrng: Random) => new Value([0], failurePoints.length - 1),
            shrink: (value) => {
              const depth = value.context as number;
              if (depth <= 0) {
                return Stream.nil();
              }
              function* g(): IterableIterator<Value<[number]>> {
                while (true) yield new Value([0], depth - 1);
              }
              return new Stream(g());
            },
            runBeforeEach: () => {},
            run: (_value: [number]) => {
              if (--remainingBeforeFailure >= 0) return null;
              remainingBeforeFailure = failurePoints[++idx];
              return { error: new Error(), errorMessage: 'failure' };
            },
            runAfterEach: () => {},
          };
          const expectedFailurePath = failurePoints.join(':');
          const out = check(p, { seed: seed }) as RunDetails<[number]>;
          expect(out.failed).toBe(true);
          expect(out.seed).toEqual(seed);
          expect(out.numRuns).toEqual(failurePoints[0] + 1);
          expect(out.numShrinks).toEqual(failurePoints.length - 1);
          expect(out.counterexamplePath).toEqual(expectedFailurePath);
        }),
      ));
    it('Should wait on async properties to complete', async () =>
      fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 100 }), fc.integer(), async (num, seed) => {
          const delay = () => new Promise((resolve) => setTimeout(resolve, 0));

          let runnerHasCompleted = false;
          const waitingResolve: (() => void)[] = [];
          let numCallsGenerate = 0;
          let numCallsRun = 0;
          const p: IRawProperty<[number]> = {
            isAsync: () => true,
            generate: () => {
              ++numCallsGenerate;
              return new Value([1], undefined);
            },
            shrink: (value) => {
              return value.value[0] === 1 ? Stream.of(new Value([42], undefined)) : Stream.nil();
            },
            runBeforeEach: async () => {},
            run: async (_value: [number]) => {
              await new Promise<void>((resolve) => {
                waitingResolve.push(resolve);
              });
              return ++numCallsRun < num ? null : { error: new Error(), errorMessage: 'error' };
            },
            runAfterEach: async () => {},
          };
          const checker = check(p, { seed: seed }) as Promise<RunDetails<[number]>>;
          checker.then(() => (runnerHasCompleted = true));

          await delay();
          while (waitingResolve.length > 0) {
            expect(waitingResolve).toHaveLength(1); // no multiple properties in parallel
            expect(runnerHasCompleted).toBe(false); // not completed yet
            waitingResolve.shift()!();
            await delay();
          }

          await delay();
          expect(runnerHasCompleted).toBe(true);

          const out = await checker;
          expect(numCallsGenerate).toEqual(num); // stopped generate at first failing run
          expect(numCallsRun).toEqual(num + 1); // stopped run one shrink after first failing run
          expect(out.failed).toBe(true);
          expect(out.numRuns).toEqual(num);
          expect(out.seed).toEqual(seed);
          expect(out.counterexample).toEqual([42]);
          return true;
        }),
      ));
    it('Should not timeout if no timeout defined', async () => {
      const p: IRawProperty<[number]> = {
        isAsync: () => true,
        generate: () => new Value([1], undefined),
        shrink: () => Stream.nil(),
        runBeforeEach: async () => {},
        run: async (_value: [number]) => null,
        runAfterEach: async () => {},
      };
      const out = await (check(p) as Promise<RunDetails<[number]>>);
      expect(out.failed).toBe(false);
    });
    it('Should not timeout if timeout not reached', async () => {
      const wait = (timeMs: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), timeMs));
      const p: IRawProperty<[number]> = {
        isAsync: () => true,
        generate: () => new Value([1], undefined),
        shrink: () => Stream.nil(),
        runBeforeEach: async () => {},
        run: async (_value: [number]) => await wait(0),
        runAfterEach: async () => {},
      };
      const out = await (check(p, { timeout: 100 }) as Promise<RunDetails<[number]>>);
      expect(out.failed).toBe(false);
    });
    it('Should timeout if it reached the timeout', async () => {
      const wait = (timeMs: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), timeMs));
      const p: IRawProperty<[number]> = {
        isAsync: () => true,
        generate: () => new Value([1], undefined),
        shrink: () => Stream.nil(),
        runBeforeEach: async () => {},
        run: async (_value: [number]) => await wait(100),
        runAfterEach: async () => {},
      };
      const out = await (check(p, { timeout: 0 }) as Promise<RunDetails<[number]>>);
      expect(out.failed).toBe(true);
    });
    it('Should timeout if task never ends', async () => {
      const neverEnds = () => new Promise<null>(() => {});
      const p: IRawProperty<[number]> = {
        isAsync: () => true,
        generate: () => new Value([1], undefined),
        shrink: () => Stream.nil(),
        runBeforeEach: async () => {},
        run: async (_value: [number]) => await neverEnds(),
        runAfterEach: async () => {},
      };
      const out = await (check(p, { timeout: 0 }) as Promise<RunDetails<[number]>>);
      expect(out.failed).toBe(true);
    });
  });
  describe('assert', () => {
    const v1 = { toString: () => 'toString(value#1)' };
    const v2 = { a: 'Hello', b: 21 };
    const failingProperty: IRawProperty<[any, any]> = {
      isAsync: () => false,
      generate: () => new Value([v1, v2], undefined),
      shrink: () => Stream.nil(),
      runBeforeEach: () => {},
      run: (_v: [any, any]) => ({ error: new Error(), errorMessage: 'error in failingProperty' }),
      runAfterEach: () => {},
    };
    const failingComplexProperty: IRawProperty<[any, any, any]> = {
      isAsync: () => false,
      generate: () => new Value([[v1, v2], v2, v1], undefined),
      shrink: () => Stream.nil(),
      runBeforeEach: () => {},
      run: (_v: [any, any, any]) => ({ error: new Error(), errorMessage: 'error in failingComplexProperty' }),
      runAfterEach: () => {},
    };
    const successProperty: IRawProperty<[any, any]> = {
      isAsync: () => false,
      generate: () => new Value([v1, v2], undefined),
      shrink: () => Stream.nil(),
      runBeforeEach: () => {},
      run: (_v: [any, any]) => null,
      runAfterEach: () => {},
    };

    it('Should throw if property is null', () => {
      expect(() => rAssert(null as any as IRawProperty<unknown>)).toThrowError();
    });
    it('Should throw if property is not a property at all', () => {
      expect(() => rAssert({} as IRawProperty<unknown>)).toThrowError();
    });
    it('Should throw if property is an Arbitrary', () => {
      expect(() => rAssert(char() as any as IRawProperty<unknown>)).toThrowError();
    });
    it('Should never throw if no failure occured', () => {
      expect(() => rAssert(successProperty, { seed: 42 })).not.toThrow();
    });
    it('Should throw on failure', () => {
      expect(() => rAssert(failingProperty, { seed: 42 })).toThrowError();
    });
    it('Should put the seed in error message', () => {
      expect(() => rAssert(failingProperty, { seed: 42 })).toThrowError(`seed: 42, path:`);
    });
    it('Should put the number of tests in error message', () => {
      expect(() => rAssert(failingProperty, { seed: 42 })).toThrowError(`failed after 1 test`);
    });
    it('Should pretty print the failing example in error message', () => {
      expect(() => rAssert(failingProperty, { seed: 42 })).toThrowError(`[${v1.toString()},${JSON.stringify(v2)}]`);
    });
    it('Should pretty print the failing complex example in error message', () => {
      expect(() => rAssert(failingComplexProperty, { seed: 42 })).toThrowError(
        `[[${v1.toString()},${JSON.stringify(v2)}],${JSON.stringify(v2)},${v1.toString()}]`,
      );
    });
    it('Should put the orginal error in error message', () => {
      expect(() => rAssert(failingProperty, { seed: 42 })).toThrowError(`Got error in failingProperty`);
    });
    describe('Impact of VerbosityLevel in case of failure', () => {
      const baseErrorMessage = '';
      const p: IRawProperty<[number]> = {
        isAsync: () => false,
        generate: () => {
          return new Value([42], undefined);
        },
        shrink: (value) => {
          return value.value[0] === 42
            ? Stream.of(new Value([48], undefined), new Value([12], undefined))
            : Stream.nil();
        },
        runBeforeEach: () => {},
        run: () => ({ error: new Error(), errorMessage: 'failure' }),
        runAfterEach: () => {},
      };
      it('Should throw with base message by default (no verbose)', () => {
        expect(() => rAssert(p)).toThrowError(baseErrorMessage);
      });
      it('Should throw without list of failures by default (no verbose)', () => {
        expect(() => rAssert(p)).not.toThrowError('Encountered failures were:');
      });
      it('Should throw without execution tree by default (no verbose)', () => {
        expect(() => rAssert(p)).not.toThrowError('Execution summary:');
      });
      it('Should throw with base message in verbose mode', () => {
        expect(() => rAssert(p, { verbose: VerbosityLevel.Verbose })).toThrowError(baseErrorMessage);
      });
      it('Should throw with list of failures in verbose mode', () => {
        expect(() => rAssert(p, { verbose: VerbosityLevel.Verbose })).toThrowError('Encountered failures were:');
      });
      it('Should throw without execution tree in verbose mode', () => {
        expect(() => rAssert(p, { verbose: VerbosityLevel.Verbose })).not.toThrowError('Execution summary:');
      });
      it('Should throw with base message in very verbose mode', () => {
        expect(() => rAssert(p, { verbose: VerbosityLevel.VeryVerbose })).toThrowError(baseErrorMessage);
      });
      it('Should throw without list of failures in very verbose mode', () => {
        expect(() => rAssert(p, { verbose: VerbosityLevel.VeryVerbose })).not.toThrowError(
          'Encountered failures were:',
        );
      });
      it('Should throw with execution tree in very verbose mode', () => {
        expect(() => rAssert(p, { verbose: VerbosityLevel.VeryVerbose })).toThrowError('Execution summary:');
      });
    });
    describe('Impact of VerbosityLevel in case of too many skipped runs', () => {
      const baseErrorMessage = 'Failed to run property, too many pre-condition failures encountered';
      const p: IRawProperty<[number]> = {
        isAsync: () => false,
        generate: () => new Value([42], undefined),
        shrink: () => Stream.nil(),
        runBeforeEach: () => {},
        run: () => new PreconditionFailure(),
        runAfterEach: () => {},
      };
      it('Should throw with base message by default (no verbose)', () => {
        expect(() => rAssert(p)).toThrowError(baseErrorMessage);
      });
      it('Should throw without list of failures by default (no verbose)', () => {
        expect(() => rAssert(p)).not.toThrowError('Encountered failures were:');
      });
      it('Should throw without execution tree by default (no verbose)', () => {
        expect(() => rAssert(p)).not.toThrowError('Execution summary:');
      });
      it('Should throw with base message in verbose mode', () => {
        expect(() => rAssert(p, { verbose: VerbosityLevel.Verbose })).toThrowError(baseErrorMessage);
      });
      it('Should throw without list of failures in verbose mode', () => {
        expect(() => rAssert(p, { verbose: VerbosityLevel.Verbose })).not.toThrowError('Encountered failures were:');
      });
      it('Should throw without execution tree in verbose mode', () => {
        expect(() => rAssert(p, { verbose: VerbosityLevel.Verbose })).not.toThrowError('Execution summary:');
      });
      it('Should throw with base message in very verbose mode', () => {
        expect(() => rAssert(p, { verbose: VerbosityLevel.VeryVerbose })).toThrowError(baseErrorMessage);
      });
      it('Should throw without list of failures in very verbose mode', () => {
        expect(() => rAssert(p, { verbose: VerbosityLevel.VeryVerbose })).not.toThrowError(
          'Encountered failures were:',
        );
      });
      it('Should throw with execution tree in very verbose mode', () => {
        expect(() => rAssert(p, { verbose: VerbosityLevel.VeryVerbose })).toThrowError('Execution summary:');
      });
    });
  });
});
