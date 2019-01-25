import * as fc from '../../../../lib/fast-check';

import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { char } from '../../../../src/check/arbitrary/CharacterArbitrary';
import { IProperty } from '../../../../src/check/property/IProperty';
import { check, assert as rAssert } from '../../../../src/check/runner/Runner';
import { Random } from '../../../../src/random/generator/Random';
import { RunDetails } from '../../../../src/check/runner/reporter/RunDetails';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import { stream, Stream } from '../../../../src/stream/Stream';
import { VerbosityLevel } from '../../../../src/check/runner/configuration/VerbosityLevel';

const MAX_NUM_RUNS = 1000;
describe('Runner', () => {
  describe('check', () => {
    it('Should throw if property is null', () => {
      expect(() => check((null as any) as IProperty<{}>)).toThrowError();
    });
    it('Should throw if property is not a property at all', () => {
      expect(() => check(<IProperty<{}>>{})).toThrowError();
    });
    it('Should throw if property is an Arbitrary', () => {
      expect(() => check(<IProperty<{}>>(<any>char()))).toThrowError();
    });
    it('Should call the property 100 times by default (on success)', () => {
      let num_calls_generate = 0;
      let num_calls_run = 0;
      const p: IProperty<[number]> = {
        isAsync: () => false,
        generate: () => {
          expect(num_calls_run).toEqual(num_calls_generate); // called run before calling back
          ++num_calls_generate;
          return new Shrinkable([num_calls_generate]) as Shrinkable<[number]>;
        },
        run: (value: [number]) => {
          expect(value[0]).toEqual(num_calls_generate); // called with previously generated value
          ++num_calls_run;
          return null;
        }
      };
      const out = check(p) as RunDetails<[number]>;
      expect(num_calls_generate).toEqual(100);
      expect(num_calls_run).toEqual(100);
      expect(out.failed).toBe(false);
    });
    it('Should ignore precondition failure runs and generate another value', async () => {
      const gapsBetweenSuccessesArb = fc.array(fc.nat(10), 100, 100);
      const successfulRunIdsArb = gapsBetweenSuccessesArb.map(gaps =>
        gaps.reduce((prev: number[], cur: number) => {
          prev.push(prev.length === 0 ? cur : prev[prev.length - 1] + cur + 1);
          return prev;
        }, [])
      );
      await fc.assert(
        fc.asyncProperty(
          successfulRunIdsArb,
          fc.boolean(),
          fc.option(fc.nat(99)),
          async (successIds, isAsyncProp, failAtId) => {
            let num_calls_generate = 0;
            let num_calls_run = 0;
            const p: IProperty<[number]> = {
              isAsync: () => isAsyncProp,
              generate: () => new Shrinkable([num_calls_generate++]) as Shrinkable<[number]>,
              run: (value: [number]) => {
                ++num_calls_run;
                const successId = successIds.indexOf(value[0]);
                if (successId !== -1) return successId === failAtId ? 'failed' : null;
                return new PreconditionFailure();
              }
            };
            const out = await check(p);
            if (failAtId == null) {
              const expectedGenerate = successIds[successIds.length - 1] + 1;
              const expectedSkips = expectedGenerate - 100;
              expect(num_calls_generate).toEqual(expectedGenerate);
              expect(num_calls_run).toEqual(expectedGenerate);
              expect(out.numRuns).toEqual(100);
              expect(out.numSkips).toEqual(expectedSkips);
              expect(out.failed).toBe(false);
            } else {
              const expectedGenerate = successIds[failAtId] + 1;
              const expectedSkips = expectedGenerate - failAtId - 1;
              expect(num_calls_generate).toEqual(expectedGenerate);
              expect(num_calls_run).toEqual(expectedGenerate);
              expect(out.numRuns).toEqual(failAtId + 1);
              expect(out.numSkips).toEqual(expectedSkips);
              expect(out.failed).toBe(true);
            }
          }
        )
      );
    });
    it('Should fail on too many precondition failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.nat(1000).chain(v => fc.record({ maxSkipsPerRun: fc.constant(v), onlySuccessId: fc.nat(2 * v + 1) })),
          fc.boolean(),
          async (settings, isAsyncProp) => {
            let num_calls_generate = 0;
            let num_precondition_failures = 0;
            const p: IProperty<[number]> = {
              isAsync: () => isAsyncProp,
              generate: () => new Shrinkable([num_calls_generate++]) as Shrinkable<[number]>,
              run: (value: [number]) => {
                if (value[0] === settings.onlySuccessId) return null;
                ++num_precondition_failures;
                return new PreconditionFailure();
              }
            };
            const out = await check(p, { numRuns: 2, maxSkipsPerRun: settings.maxSkipsPerRun });
            const expectedSkips = 2 * settings.maxSkipsPerRun + 1;
            const expectedRuns = settings.onlySuccessId === expectedSkips ? 0 : 1;
            expect(out.numRuns).toEqual(expectedRuns);
            expect(num_precondition_failures).toEqual(expectedSkips);
            expect(out.numSkips).toEqual(expectedSkips);
            expect(out.failed).toBe(true);
          }
        )
      );
    });
    it('Should never call shrink on success', () => {
      let num_calls_generate = 0;
      let num_calls_run = 0;
      const p: IProperty<[number]> = {
        isAsync: () => false,
        generate: () => {
          ++num_calls_generate;
          return new Shrinkable([0], () => {
            throw 'Not implemented';
          }) as Shrinkable<[number]>;
        },
        run: (value: [number]) => {
          ++num_calls_run;
          return null;
        }
      };
      const out = check(p) as RunDetails<[number]>;
      expect(num_calls_generate).toEqual(100);
      expect(num_calls_run).toEqual(100);
      expect(out.failed).toBe(false);
    });
    it('Should call the property 100 times by default (except on error)', () =>
      fc.assert(
        fc.property(fc.integer(1, 100), fc.integer(), (num, seed) => {
          let num_calls_generate = 0;
          let num_calls_run = 0;
          const p: IProperty<[number]> = {
            isAsync: () => false,
            generate: () => {
              ++num_calls_generate;
              return new Shrinkable([0]) as Shrinkable<[number]>;
            },
            run: (value: [number]) => {
              return ++num_calls_run < num ? null : 'error';
            }
          };
          const out = check(p, { seed: seed }) as RunDetails<[number]>;
          expect(num_calls_generate).toEqual(num); // stopped generate at first failing run
          expect(num_calls_run).toEqual(num); //  no shrink for first failing run
          expect(out.failed).toBe(true);
          expect(out.numRuns).toEqual(num);
          expect(out.seed).toEqual(seed);
          return true;
        })
      ));
    it('Should alter the number of runs when asked to', () =>
      fc.assert(
        fc.property(fc.nat(MAX_NUM_RUNS), num => {
          let num_calls_generate = 0;
          let num_calls_run = 0;
          const p: IProperty<[number]> = {
            isAsync: () => false,
            generate: () => {
              ++num_calls_generate;
              return new Shrinkable([0]) as Shrinkable<[number]>;
            },
            run: (value: [number]) => {
              ++num_calls_run;
              return null;
            }
          };
          const out = check(p, { numRuns: num }) as RunDetails<[number]>;
          expect(num_calls_generate).toEqual(num);
          expect(num_calls_run).toEqual(num);
          expect(out.failed).toBe(false);
          return true;
        })
      ));
    it('Should generate the same values given the same seeds', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const buildPropertyFor = function(runOn: number[]) {
            const p: IProperty<[number]> = {
              isAsync: () => false,
              generate: (rng: Random) => {
                return new Shrinkable([rng.nextInt()]) as Shrinkable<[number]>;
              },
              run: (value: [number]) => {
                runOn.push(value[0]);
                return null;
              }
            };
            return p;
          };
          let data1: number[] = [];
          let data2: number[] = [];
          check(buildPropertyFor(data1), { seed: seed });
          check(buildPropertyFor(data2), { seed: seed });
          expect(data2).toEqual(data1);
          return true;
        })
      ));
    it('Should never call shrink if endOnFailure', () => {
      const p: IProperty<[number]> = {
        isAsync: () => false,
        generate: () => {
          return new Shrinkable([0], () => {
            throw 'Not implemented';
          }) as Shrinkable<[number]>;
        },
        run: (value: [number]) => {
          return 'failure';
        }
      };
      const out = check(p, { endOnFailure: true }) as RunDetails<[number]>;
      expect(out.failed).toBe(true);
      expect(out.numShrinks).toEqual(0);
    });
    it('Should compute values for path before removing shrink if endOnFailure', () => {
      const p: IProperty<[number]> = {
        isAsync: () => false,
        generate: () => {
          const g = function*() {
            yield new Shrinkable([42], () => {
              throw 'Not implemented';
            }) as Shrinkable<[number]>;
          };
          return new Shrinkable([0], () => stream(g())) as Shrinkable<[number]>;
        },
        run: (value: [number]) => {
          return value[0] === 42 ? 'failure' : null;
        }
      };
      const out = check(p, { path: '0:0', endOnFailure: true }) as RunDetails<[number]>;
      expect(out.failed).toBe(true);
      expect(out.numShrinks).toEqual(0);
    });
    it('Should not provide list of failures by default (no verbose)', () => {
      const p: IProperty<[number]> = {
        isAsync: () => false,
        generate: () => new Shrinkable([42]) as Shrinkable<[number]>,
        run: () => 'failure'
      };
      const out = check(p) as RunDetails<[number]>;
      expect(out.failures).toHaveLength(0);
    });
    it('Should provide the list of failures in verbose mode', () => {
      const g = function*() {
        yield new Shrinkable([48]) as Shrinkable<[number]>;
        yield new Shrinkable([12]) as Shrinkable<[number]>;
      };
      const p: IProperty<[number]> = {
        isAsync: () => false,
        generate: () => new Shrinkable([42], () => stream(g())) as Shrinkable<[number]>,
        run: () => 'failure'
      };
      const out = check(p, { verbose: true }) as RunDetails<[number]>;
      expect(out.failures).not.toHaveLength(0);
      expect(out.failures).toEqual([[42], [48]]);
    });
    it('Should build the right counterexamplePath', () =>
      fc.assert(
        fc.property(fc.integer(), fc.array(fc.nat(99), 1, 100), (seed, failurePoints) => {
          // Each entry (at index idx) in failurePoints represents the number of runs
          // required before failing for the level <idx>
          // Basically it must fail before the end of the execution (100 runs by default)
          // so failure points are between 0 and 99 inclusive

          const deepShrinkable = function(depth: number): Shrinkable<[number]> {
            if (depth <= 0) return new Shrinkable([0]) as Shrinkable<[number]>;
            function* g(subDepth: number): IterableIterator<Shrinkable<[number]>> {
              while (true) yield deepShrinkable(subDepth);
            }
            return new Shrinkable([0], () => stream(g(depth - 1))) as Shrinkable<[number]>;
          };

          let idx = 0;
          let remainingBeforeFailure = failurePoints[idx];
          const p: IProperty<[number]> = {
            isAsync: () => false,
            generate: (rng: Random) => deepShrinkable(failurePoints.length - 1),
            run: (value: [number]) => {
              if (--remainingBeforeFailure >= 0) return null;
              remainingBeforeFailure = failurePoints[++idx];
              return 'failure';
            }
          };
          const expectedFailurePath = failurePoints.join(':');
          const out = check(p, { seed: seed }) as RunDetails<[number]>;
          expect(out.failed).toBe(true);
          expect(out.seed).toEqual(seed);
          expect(out.numRuns).toEqual(failurePoints[0] + 1);
          expect(out.numShrinks).toEqual(failurePoints.length - 1);
          expect(out.counterexamplePath).toEqual(expectedFailurePath);
        })
      ));
    it('Should wait on async properties to complete', async () =>
      fc.assert(
        fc.asyncProperty(fc.integer(1, 100), fc.integer(), async (num, seed) => {
          const delay = () => new Promise((resolve, reject) => setTimeout(resolve, 0));

          let runnerHasCompleted = false;
          let waitingResolve: (() => void)[] = [];
          let num_calls_generate = 0;
          let num_calls_run = 0;
          const p: IProperty<[number]> = {
            isAsync: () => true,
            generate: () => {
              ++num_calls_generate;
              const shrinkedValue = new Shrinkable([42]) as Shrinkable<[number]>;
              const g = function*() {
                yield shrinkedValue;
              };
              return new Shrinkable([1], () => new Stream(g())) as Shrinkable<[number]>;
            },
            run: async (value: [number]) => {
              await new Promise((resolve, reject) => {
                waitingResolve.push(resolve);
              });
              return ++num_calls_run < num ? null : 'error';
            }
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
          expect(num_calls_generate).toEqual(num); // stopped generate at first failing run
          expect(num_calls_run).toEqual(num + 1); // stopped run one shrink after first failing run
          expect(out.failed).toBe(true);
          expect(out.numRuns).toEqual(num);
          expect(out.seed).toEqual(seed);
          expect(out.counterexample).toEqual([42]);
          return true;
        })
      ));
    it('Should not timeout if no timeout defined', async () => {
      const p: IProperty<[number]> = {
        isAsync: () => true,
        generate: () => new Shrinkable([1]) as Shrinkable<[number]>,
        run: async (value: [number]) => null
      };
      const out = await (check(p) as Promise<RunDetails<[number]>>);
      expect(out.failed).toBe(false);
    });
    it('Should not timeout if timeout not reached', async () => {
      const wait = (timeMs: number) => new Promise<null>((resolve, reject) => setTimeout(resolve, timeMs));
      const p: IProperty<[number]> = {
        isAsync: () => true,
        generate: () => new Shrinkable([1]) as Shrinkable<[number]>,
        run: async (value: [number]) => await wait(0)
      };
      const out = await (check(p, { timeout: 100 }) as Promise<RunDetails<[number]>>);
      expect(out.failed).toBe(false);
    });
    it('Should timeout if it reached the timeout', async () => {
      const wait = (timeMs: number) => new Promise<null>((resolve, reject) => setTimeout(resolve, timeMs));
      const p: IProperty<[number]> = {
        isAsync: () => true,
        generate: () => new Shrinkable([1]) as Shrinkable<[number]>,
        run: async (value: [number]) => await wait(100)
      };
      const out = await (check(p, { timeout: 0 }) as Promise<RunDetails<[number]>>);
      expect(out.failed).toBe(true);
    });
    it('Should timeout if task never ends', async () => {
      const neverEnds = () => new Promise<null>((resolve, reject) => {});
      const p: IProperty<[number]> = {
        isAsync: () => true,
        generate: () => new Shrinkable([1]) as Shrinkable<[number]>,
        run: async (value: [number]) => await neverEnds()
      };
      const out = await (check(p, { timeout: 0 }) as Promise<RunDetails<[number]>>);
      expect(out.failed).toBe(true);
    });
  });
  describe('assert', () => {
    const v1 = { toString: () => 'toString(value#1)' };
    const v2 = { a: 'Hello', b: 21 };
    const failingProperty: IProperty<[any, any]> = {
      isAsync: () => false,
      generate: () => new Shrinkable([v1, v2]) as Shrinkable<[any, any]>,
      run: (v: [any, any]) => 'error in failingProperty'
    };
    const failingComplexProperty: IProperty<[any, any, any]> = {
      isAsync: () => false,
      generate: () => new Shrinkable([[v1, v2], v2, v1]) as Shrinkable<[any, any, any]>,
      run: (v: [any, any, any]) => 'error in failingComplexProperty'
    };
    const successProperty: IProperty<[any, any]> = {
      isAsync: () => false,
      generate: () => new Shrinkable([v1, v2]) as Shrinkable<[any, any]>,
      run: (v: [any, any]) => null
    };

    it('Should throw if property is null', () => {
      expect(() => rAssert((null as any) as IProperty<{}>)).toThrowError();
    });
    it('Should throw if property is not a property at all', () => {
      expect(() => rAssert(<IProperty<{}>>{})).toThrowError();
    });
    it('Should throw if property is an Arbitrary', () => {
      expect(() => rAssert(<IProperty<{}>>(<any>char()))).toThrowError();
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
        `[[${v1.toString()},${JSON.stringify(v2)}],${JSON.stringify(v2)},${v1.toString()}]`
      );
    });
    it('Should put the orginal error in error message', () => {
      expect(() => rAssert(failingProperty, { seed: 42 })).toThrowError(`Got error: error in failingProperty`);
    });
    describe('Impact of VerbosityLevel in case of failure', () => {
      const baseErrorMessage = '';
      const p: IProperty<[number]> = {
        isAsync: () => false,
        generate: () => {
          const g = function*() {
            yield new Shrinkable([48]) as Shrinkable<[number]>;
            yield new Shrinkable([12]) as Shrinkable<[number]>;
          };
          return new Shrinkable([42], () => stream(g())) as Shrinkable<[number]>;
        },
        run: () => 'failure'
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
          'Encountered failures were:'
        );
      });
      it('Should throw with execution tree in very verbose mode', () => {
        expect(() => rAssert(p, { verbose: VerbosityLevel.VeryVerbose })).toThrowError('Execution summary:');
      });
    });
    describe('Impact of VerbosityLevel in case of too many skipped runs', () => {
      const baseErrorMessage = 'Failed to run property, too many pre-condition failures encountered';
      const p: IProperty<[number]> = {
        isAsync: () => false,
        generate: () => new Shrinkable([42]) as Shrinkable<[number]>,
        run: () => new PreconditionFailure()
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
          'Encountered failures were:'
        );
      });
      it('Should throw with execution tree in very verbose mode', () => {
        expect(() => rAssert(p, { verbose: VerbosityLevel.VeryVerbose })).toThrowError('Execution summary:');
      });
    });
  });
});
