import fc from '../../../../../lib/fast-check';
import {
  ScheduledTask,
  SchedulerImplem,
  TaskSelector,
} from '../../../../../src/arbitrary/_internals/implementations/SchedulerImplem';
import { Scheduler } from '../../../../../src/arbitrary/_internals/interfaces/Scheduler';
import { cloneMethod, hasCloneMethod } from '../../../../../src/check/symbols';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('SchedulerImplem', () => {
  describe('waitOne', () => {
    it('should throw when there is no scheduled promise in the pipe', async () => {
      // Arrange
      const act = jest.fn().mockImplementation((f) => f());
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex: jest.fn() };

      // Act
      const s = new SchedulerImplem(act, taskSelector);

      // Assert
      await expect(s.waitOne()).rejects.toMatchInlineSnapshot(`[Error: No task scheduled]`);
    });

    it('should wrap waitOne call using act whenever specified', async () => {
      // Arrange
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndexLengths: number[] = [];
      const nextTaskIndex = jest.fn().mockImplementation((tasks: ScheduledTask<unknown>[]) => {
        // `tasks` pointer being re-used from one call to another (mutate)
        // we cannot rely on toHaveBeenCalledWith
        nextTaskIndexLengths.push(tasks.length);
        return 0;
      });
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      s.schedule(Promise.resolve(42));

      // Assert
      expect(act).not.toHaveBeenCalled();
      expect(nextTaskIndex).not.toHaveBeenCalled();
      await s.waitOne();
      expect(act).toHaveBeenCalledTimes(1);
      expect(nextTaskIndex).toHaveBeenCalledTimes(1);
      expect(nextTaskIndexLengths).toEqual([1]); // only one task scheduled
    });

    it('should wait the end of act before resolving waitOne', async () => {
      // Arrange
      const buildUnresolved = () => {
        let resolve = () => {};
        const p = new Promise<void>((r) => (resolve = r));
        return { p, resolve };
      };
      const delay = () => new Promise((r) => setTimeout(r, 0));
      const p1 = buildUnresolved();
      const p2 = buildUnresolved();
      const act = jest.fn().mockImplementation(async (f) => {
        await p1.p;
        await f();
        await p2.p;
      });
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      let promiseResolved = false;
      let waitOneResolved = false;
      const s = new SchedulerImplem(act, taskSelector);
      s.schedule(Promise.resolve(1)).then(() => (promiseResolved = true));

      // Assert
      s.waitOne().then(() => (waitOneResolved = true));
      await delay();
      expect(promiseResolved).toBe(false);
      expect(waitOneResolved).toBe(false);

      p1.resolve();
      await delay();
      expect(promiseResolved).toBe(true);
      expect(waitOneResolved).toBe(false);

      p2.resolve();
      await delay();
      expect(promiseResolved).toBe(true);
      expect(waitOneResolved).toBe(true);
    });
  });

  describe('waitAll', () => {
    it('should not throw when there is no scheduled promise in the pipe', async () => {
      // Arrange
      const act = jest.fn().mockImplementation((f) => f());
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex: jest.fn() };

      // Act
      const s = new SchedulerImplem(act, taskSelector);

      // Assert
      await s.waitAll();
    });

    it('should wrap waitAll call using act whenever specified', async () =>
      fc.assert(
        fc.asyncProperty(fc.infiniteStream(fc.nat()), async (seeds) => {
          // Arrange
          const act = jest.fn().mockImplementation((f) => f());
          const nextTaskIndexLengths: number[] = [];
          const nextTaskIndex = buildSeededNextTaskIndex(seeds, nextTaskIndexLengths);
          const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

          // Act
          const s = new SchedulerImplem(act, taskSelector);
          s.schedule(Promise.resolve(1));
          s.schedule(Promise.resolve(8));
          s.schedule(Promise.resolve(42));

          // Assert
          expect(act).not.toHaveBeenCalled();
          expect(nextTaskIndex).not.toHaveBeenCalled();
          await s.waitAll();
          expect(act).toHaveBeenCalledTimes(3);
          expect(nextTaskIndex).toHaveBeenCalledTimes(3);
          expect(nextTaskIndexLengths).toEqual([3, 2, 1]);
        })
      ));

    it('should wait the end of act before moving to the next task', async () =>
      fc.assert(
        fc.asyncProperty(fc.infiniteStream(fc.nat()), async (seeds) => {
          // Arrange
          let locked = false;
          const updateLocked = (newLocked: boolean) => (locked = newLocked);
          const act = jest.fn().mockImplementation(async (f) => {
            expect(locked).toBe(false);
            updateLocked(true); // equivalent to: locked = true
            await f();
            updateLocked(false); // equivalent to: locked = false
          });
          const nextTaskIndex = buildSeededNextTaskIndex(seeds);
          const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

          // Act
          const s = new SchedulerImplem(act, taskSelector);
          s.schedule(Promise.resolve(1));
          s.schedule(Promise.resolve(8));
          s.schedule(Promise.resolve(42));

          // Assert
          await s.waitAll();
          expect(locked).toBe(false);
        })
      ));
  });

  describe('schedule', () => {
    it('should postpone completion of promise but call it with right parameters in case of success', async () => {
      // Arrange
      const expectedThenValue = 123;
      const thenFunction = jest.fn();
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndexLengths: number[] = [];
      const nextTaskIndex = jest.fn().mockImplementationOnce((tasks: ScheduledTask<unknown>[]) => {
        nextTaskIndexLengths.push(tasks.length); // tasks are mutated, toHaveBeenCalledWith cannot be used
        return 0;
      });
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      s.schedule(Promise.resolve(expectedThenValue)).then(thenFunction);

      // Assert
      expect(s.count()).toBe(1);
      expect(thenFunction).not.toHaveBeenCalled();
      await s.waitOne();
      expect(thenFunction).toHaveBeenCalled();
      expect(thenFunction).toHaveBeenCalledTimes(1);
      expect(thenFunction).toHaveBeenCalledWith(expectedThenValue);
      expect(act).toHaveBeenCalledTimes(1);
      expect(nextTaskIndex).toHaveBeenCalledTimes(1);
      expect(nextTaskIndexLengths).toEqual([1]); // only one task scheduled
    });

    it('should postpone completion of promise but call it with right parameters in case of failure', async () => {
      // Arrange
      const expectedThenValue = 123;
      const catchFunction = jest.fn();
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      s.schedule(Promise.reject(expectedThenValue)).then(() => {}, catchFunction);

      // Assert
      expect(s.count()).toBe(1);
      expect(catchFunction).not.toHaveBeenCalled();
      await s.waitOne();
      expect(catchFunction).toHaveBeenCalled();
      expect(catchFunction).toHaveBeenCalledTimes(1);
      expect(catchFunction).toHaveBeenCalledWith(expectedThenValue);
    });

    it('should be able to schedule multiple promises', async () => {
      // Arrange
      const tasks = [Promise.resolve(1), Promise.resolve(8), Promise.resolve(2)];
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest
        .fn()
        .mockImplementationOnce((scheduledTasks) => {
          expect(scheduledTasks).toEqual([
            expect.objectContaining({ original: tasks[0] }), // selected as nextTaskIndex returns 0
            expect.objectContaining({ original: tasks[1] }),
            expect.objectContaining({ original: tasks[2] }),
          ]);
          return 0;
        })
        .mockImplementationOnce((scheduledTasks) => {
          expect(scheduledTasks).toEqual([
            expect.objectContaining({ original: tasks[1] }),
            expect.objectContaining({ original: tasks[2] }), // selected as nextTaskIndex returns 1
          ]);
          return 1;
        })
        .mockImplementationOnce((scheduledTasks) => {
          expect(scheduledTasks).toEqual([
            expect.objectContaining({ original: tasks[1] }), // selected as nextTaskIndex returns 0
          ]);
          return 0;
        });
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      for (const t of tasks) {
        s.schedule(t);
      }

      // Assert
      expect(s.count()).toBe(tasks.length);
      await s.waitAll();
      expect(s.count()).toBe(0);
      expect(act).toHaveBeenCalledTimes(3);
      expect(nextTaskIndex).toHaveBeenCalledTimes(3);
    });

    it('should be able to waitAll promises scheduling others', async () =>
      fc.assert(
        fc.asyncProperty(fc.infiniteStream(fc.nat()), async (seeds) => {
          // Arrange
          const status = { done: false };
          const nothingResolved = {
            1: false,
            2: false,
            3: false,
            4: false,
            5: false,
          };
          const resolved = { ...nothingResolved };
          const act = jest.fn().mockImplementation((f) => f());
          const nextTaskIndex = buildSeededNextTaskIndex(seeds);
          const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

          // Act
          const s = new SchedulerImplem(act, taskSelector);
          s.schedule(Promise.resolve(1)).then(() => {
            resolved[1] = true;
            Promise.all([
              s.schedule(Promise.resolve(2)).then(() => {
                resolved[2] = true;
              }),
              s.schedule(Promise.resolve(3)).then(() => {
                resolved[3] = true;
                s.schedule(Promise.resolve(4)).then(() => {
                  resolved[4] = true;
                });
              }),
            ]).then(() => {
              s.schedule(Promise.resolve(5)).then(() => {
                resolved[5] = true;
                status.done = true;
              });
            });
          });

          // Assert
          expect(status.done).toBe(false);
          expect(resolved).toEqual(nothingResolved);
          await s.waitAll();
          expect(status.done).toBe(true);
          expect(resolved).toEqual({
            1: true,
            2: true,
            3: true,
            4: true,
            5: true,
          });
        })
      ));

    it('should show both resolved, rejected and pending promises in toString', async () => {
      // Arrange
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest
        .fn()
        .mockReturnValueOnce(5) // task#6 resolved, state was: [0,1,2,3,4,5,6,7,8,9]
        .mockReturnValueOnce(5) // task#7 resolved, state was: [0,1,2,3,4,6,7,8,9]
        .mockReturnValueOnce(1) // task#2 resolved, state was: [0,1,2,3,4,7,8,9]
        .mockReturnValueOnce(0) // task#1 resolved, state was: [0,2,3,4,7,8,9]
        .mockReturnValueOnce(1) // task#4 resolved, state was: [2,3,4,7,8,9]
        .mockReturnValueOnce(2) // task#8 resolved, state was: [2,4,7,8,9]
        .mockReturnValueOnce(3) // task#10 resolved, state was: [2,4,8,9]
        .mockReturnValueOnce(0) // task#3 resolved, state was: [2,4,8]
        .mockReturnValueOnce(0) // task#5 resolved, state was: [4,8]
        .mockReturnValueOnce(0); // task#9 resolved, state was: [8]
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      for (let idx = 0; idx !== 10; ++idx) {
        if (idx % 2 === 0) s.schedule(Promise.resolve(idx));
        else s.schedule(Promise.reject(idx));
      }

      // Assert
      expect(s.count()).toBe(10);
      expect(s.toString()).toMatchInlineSnapshot(`
          "schedulerFor()\`
          -> [task\${1}] promise pending
          -> [task\${2}] promise pending
          -> [task\${3}] promise pending
          -> [task\${4}] promise pending
          -> [task\${5}] promise pending
          -> [task\${6}] promise pending
          -> [task\${7}] promise pending
          -> [task\${8}] promise pending
          -> [task\${9}] promise pending
          -> [task\${10}] promise pending\`"
        `);
      await s.waitOne();
      await s.waitOne();
      await s.waitOne();
      expect(s.toString()).toMatchInlineSnapshot(`
          "schedulerFor()\`
          -> [task\${6}] promise rejected with value 5
          -> [task\${7}] promise resolved with value 6
          -> [task\${2}] promise rejected with value 1
          -> [task\${1}] promise pending
          -> [task\${3}] promise pending
          -> [task\${4}] promise pending
          -> [task\${5}] promise pending
          -> [task\${8}] promise pending
          -> [task\${9}] promise pending
          -> [task\${10}] promise pending\`"
        `);
      await s.waitOne();
      await s.waitOne();
      await s.waitOne();
      expect(s.toString()).toMatchInlineSnapshot(`
          "schedulerFor()\`
          -> [task\${6}] promise rejected with value 5
          -> [task\${7}] promise resolved with value 6
          -> [task\${2}] promise rejected with value 1
          -> [task\${1}] promise resolved with value 0
          -> [task\${4}] promise rejected with value 3
          -> [task\${8}] promise rejected with value 7
          -> [task\${3}] promise pending
          -> [task\${5}] promise pending
          -> [task\${9}] promise pending
          -> [task\${10}] promise pending\`"
        `);
      await s.waitOne();
      await s.waitOne();
      await s.waitOne();
      await s.waitOne();
      expect(s.toString()).toMatchInlineSnapshot(`
          "schedulerFor()\`
          -> [task\${6}] promise rejected with value 5
          -> [task\${7}] promise resolved with value 6
          -> [task\${2}] promise rejected with value 1
          -> [task\${1}] promise resolved with value 0
          -> [task\${4}] promise rejected with value 3
          -> [task\${8}] promise rejected with value 7
          -> [task\${10}] promise rejected with value 9
          -> [task\${3}] promise resolved with value 2
          -> [task\${5}] promise resolved with value 4
          -> [task\${9}] promise resolved with value 8\`"
        `);
      expect(s.count()).toBe(0);
    });

    it('should properly replay schedule on cloned instance', async () => {
      // Arrange
      const promises = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
      const then1Function = jest.fn();
      const then2Function = jest.fn();
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex1 = jest.fn().mockReturnValueOnce(2).mockReturnValueOnce(1).mockReturnValueOnce(0);
      const nextTaskIndex2 = jest.fn().mockReturnValueOnce(2).mockReturnValueOnce(1).mockReturnValueOnce(0);
      const taskSelector2: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex: nextTaskIndex2 };
      const taskSelector1: TaskSelector<unknown> = {
        clone: jest.fn().mockReturnValueOnce(taskSelector2),
        nextTaskIndex: nextTaskIndex1,
      };

      // Act
      const s1 = new SchedulerImplem(act, taskSelector1);
      for (const p of promises) {
        s1.schedule(p).then(then1Function);
      }
      await s1.waitAll();
      if (!hasCloneMethod(s1)) {
        throw new Error('Expected s1 to be cloneable');
      }
      const s2 = s1[cloneMethod]();
      for (const p of promises) {
        s2.schedule(p).then(then2Function);
      }
      await s2.waitAll();

      // Assert
      expect(then1Function.mock.calls).toEqual(then2Function.mock.calls);
    });

    it('should attach passed metadata into the report', async () => {
      // Arrange
      const expectedMetadata = Symbol('123');
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      s.schedule(Promise.resolve(), 'label', expectedMetadata);

      // Assert
      await s.waitAll();
      const report = s.report();
      expect(report).toHaveLength(1);
      expect(report[0].status).toBe('resolved');
      expect(report[0].metadata).toBe(expectedMetadata);
    });

    it('should attach passed metadata into the report even if not executed', async () => {
      // Arrange
      const expectedMetadata = Symbol('123');
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      s.schedule(Promise.resolve(), 'label', expectedMetadata);

      // Assert
      const report = s.report();
      expect(report).toHaveLength(1);
      expect(report[0].status).toBe('pending');
      expect(report[0].metadata).toBe(expectedMetadata);
    });

    type ExecutionPlan = { name: string; children: ExecutionPlan[] };
    it('should be able to schedule new tasks from other tasks and wait them all with waitAll', async () =>
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.letrec((tie) => ({
              self: fc.record({
                name: fc.hexaString({ minLength: 4, maxLength: 4 }).noBias(),
                children: fc.oneof(
                  { depthFactor: 0.5 },
                  fc.constant<ExecutionPlan[]>([]),
                  fc.array(tie('self') as fc.Arbitrary<ExecutionPlan>)
                ),
              }),
            })).self,
            { minLength: 1 }
          ),
          fc.infiniteStream(fc.nat()),
          async (plan, seeds) => {
            // Arrange
            const act = jest.fn().mockImplementation((f) => f());
            const nextTaskIndex = buildSeededNextTaskIndex(seeds);
            const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };
            const computeTasksInPlan = (tasks: ExecutionPlan[]) => {
              let count = 0;
              for (const t of tasks) {
                count += 1 + computeTasksInPlan(t.children);
              }
              return count;
            };
            const schedulePlan = (s: Scheduler, tasks: ExecutionPlan[]) => {
              for (const t of tasks) {
                s.schedule(Promise.resolve(t.name), t.name).then(() => schedulePlan(s, t.children));
              }
            };

            // Act
            const s = new SchedulerImplem(act, taskSelector);
            schedulePlan(s, plan);

            // Assert
            await s.waitAll();
            expect(s.count()).toBe(0);
            expect(s.report()).toHaveLength(computeTasksInPlan(plan));
          }
        )
      ));
  });

  describe('scheduleFunction', () => {
    it('should schedule a new promise when calling a scheduled function', async () => {
      // Arrange
      const firstCallInput = 1;
      const expectedThenValue = 123;
      const thenFunction = jest.fn();
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      const scheduledFun = s.scheduleFunction(async (id) => id + expectedThenValue);

      // Assert
      expect(s.count()).toBe(0);
      expect(thenFunction).not.toHaveBeenCalled();
      scheduledFun(firstCallInput).then(thenFunction);
      expect(s.count()).toBe(1);
      expect(thenFunction).not.toHaveBeenCalled();
      await s.waitOne();
      expect(thenFunction).toHaveBeenCalled();
      expect(thenFunction).toHaveBeenCalledTimes(1);
      expect(thenFunction).toHaveBeenCalledWith(firstCallInput + expectedThenValue);
    });

    it('should be able to call a scheduled function multiple times', async () => {
      // Arrange
      const firstCallInput = 1;
      const secondCallInput = 10;
      const expectedThenValue = 123;
      const thenFunction = jest.fn();
      const then2Function = jest.fn();
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest
        .fn()
        .mockReturnValueOnce(1) // resolving then2Function first
        .mockReturnValueOnce(0); // resolving thenFunction second
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      const scheduledFun = s.scheduleFunction(async (id) => id + expectedThenValue);

      // Assert
      expect(s.count()).toBe(0);
      scheduledFun(firstCallInput).then(thenFunction);
      scheduledFun(secondCallInput).then(then2Function);
      expect(s.count()).toBe(2);
      expect(thenFunction).not.toHaveBeenCalled();
      expect(then2Function).not.toHaveBeenCalled();
      await s.waitAll();
      expect(thenFunction).toHaveBeenCalledWith(firstCallInput + expectedThenValue);
      expect(then2Function).toHaveBeenCalledWith(secondCallInput + expectedThenValue);
    });

    it('should be able to waitAll for a scheduled function calling itself', async () => {
      // Arrange
      const firstCallInput = 10;
      const thenFunction = jest.fn();
      const thenImplem = (remaining: number) => {
        thenFunction();
        if (remaining <= 0) return;
        scheduledFun(remaining - 1).then(thenImplem);
      };
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      const scheduledFun = s.scheduleFunction(async (id) => id);

      // Assert
      expect(s.count()).toBe(0);
      scheduledFun(firstCallInput).then(thenImplem);
      await s.waitAll();
      expect(thenFunction).toHaveBeenCalledTimes(firstCallInput + 1);
    });

    it('should show both resolved, rejected and pending promises in toString', async () => {
      // Arrange
      const calls: [number, number][] = [
        [0, 3],
        [1, 4],
        [6, 0],
      ];
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest
        .fn()
        .mockReturnValueOnce(2) // task#3 resolved, state was: [0,1,2]
        .mockReturnValueOnce(0) // task#1 resolved, state was: [0,1]
        .mockReturnValueOnce(0); // task#2 resolved, state was: [1]
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      const scheduledFun = s.scheduleFunction(async (a: number, b: number) => {
        if (a >= b) throw new Error(`Unexpected: ${a} >= ${b}`);
        return a;
      });
      for (const ins of calls) {
        scheduledFun(...ins);
      }

      // Assert
      expect(s.count()).toBe(calls.length);
      expect(s.toString()).toMatchInlineSnapshot(`
          "schedulerFor()\`
          -> [task\${1}] function::(0,3) pending
          -> [task\${2}] function::(1,4) pending
          -> [task\${3}] function::(6,0) pending\`"
        `);
      await s.waitOne();
      await s.waitOne();
      expect(s.toString()).toMatchInlineSnapshot(`
        "schedulerFor()\`
        -> [task\${3}] function::(6,0) rejected with value new Error(\\"Unexpected: 6 >= 0\\")
        -> [task\${1}] function::(0,3) resolved with value 0
        -> [task\${2}] function::(1,4) pending\`"
      `);
      await s.waitOne();
      expect(s.toString()).toMatchInlineSnapshot(`
        "schedulerFor()\`
        -> [task\${3}] function::(6,0) rejected with value new Error(\\"Unexpected: 6 >= 0\\")
        -> [task\${1}] function::(0,3) resolved with value 0
        -> [task\${2}] function::(1,4) resolved with value 1\`"
      `);
      expect(s.count()).toBe(0);
    });

    it('should show function name if any in toString', async () => {
      // Arrange
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest
        .fn()
        .mockReturnValueOnce(2) // task#3 resolved, state was: [0,1,2]
        .mockReturnValueOnce(0) // task#1 resolved, state was: [0,1]
        .mockReturnValueOnce(0); // task#2 resolved, state was: [1]
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      s.scheduleFunction(async function taskA() {
        return { response: 'dummy response for task A' };
      })();
      s.scheduleFunction(async function anotherTaskNameForB(_input: number) {
        return 3;
      })(42);
      s.scheduleFunction(async function somethingElseForC(_complexInstance: any, _anotherInput: number) {
        return 'c';
      })({ a: { b: 5 }, c: 0 }, 4);

      // Assert
      expect(s.count()).toBe(3);
      expect(s.toString()).toMatchInlineSnapshot(`
          "schedulerFor()\`
          -> [task\${1}] function::taskA() pending
          -> [task\${2}] function::anotherTaskNameForB(42) pending
          -> [task\${3}] function::somethingElseForC({\\"a\\":{\\"b\\":5},\\"c\\":0},4) pending\`"
        `);
      await s.waitAll();
      expect(s.toString()).toMatchInlineSnapshot(`
          "schedulerFor()\`
          -> [task\${3}] function::somethingElseForC({\\"a\\":{\\"b\\":5},\\"c\\":0},4) resolved with value \\"c\\"
          -> [task\${1}] function::taskA() resolved with value {\\"response\\":\\"dummy response for task A\\"}
          -> [task\${2}] function::anotherTaskNameForB(42) resolved with value 3\`"
        `);
      expect(s.count()).toBe(0);
    });
  });

  describe('scheduleSequence', () => {
    it('should accept empty sequences', async () => {
      // Arrange
      const act = jest.fn().mockImplementation((f) => f());
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex: jest.fn() };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      const status = s.scheduleSequence([]);

      // Assert
      expect(s.count()).toBe(0);
      expect(status.done).toBe(true);
      expect(status.faulty).toBe(false);
    });

    it('should consider a sequence as a serie of tasks and not parallel tasks', async () => {
      // Arrange
      const p1Builder = jest.fn().mockResolvedValue(1);
      const p2Builder = jest.fn().mockResolvedValue(2);
      const p3Builder = jest.fn().mockResolvedValue(3);
      const p4Builder = jest.fn().mockResolvedValue(4);
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      s.scheduleSequence([
        { builder: p1Builder, label: 'p1' },
        { builder: p2Builder, label: 'p2' },
        { builder: p3Builder, label: 'p3' },
        { builder: p4Builder, label: 'p4' },
      ]);

      // Assert
      expect(s.count()).toBe(1);
      await s.waitAll();
      expect(s.count()).toBe(0);
    });

    it('should mark schedule as done at the end of the sequence but not faulty', async () => {
      // Arrange
      const p1Builder = jest.fn().mockResolvedValue(1);
      const p2Builder = jest.fn().mockResolvedValue(2);
      const p3Builder = jest.fn().mockResolvedValue(3);
      const p4Builder = jest.fn().mockResolvedValue(4);
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      const status = s.scheduleSequence([
        { builder: p1Builder, label: 'p1' },
        { builder: p2Builder, label: 'p2' },
        { builder: p3Builder, label: 'p3' },
        { builder: p4Builder, label: 'p4' },
      ]);

      // Assert
      while (s.count() > 0) {
        expect(status.done).toBe(false);
        expect(status.faulty).toBe(false);
        await s.waitOne();
      }
      expect(status.done).toBe(true);
      expect(status.faulty).toBe(false);
    });

    it('should mark faulty schedule as not done but as faulty', async () => {
      // Arrange
      const p1Builder = jest.fn().mockResolvedValue(1);
      const p2Builder = jest.fn().mockResolvedValue(2);
      const p3Builder = jest.fn().mockRejectedValue(3);
      const p4Builder = jest.fn().mockResolvedValue(4);
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      const status = s.scheduleSequence([
        { builder: p1Builder, label: 'p1' },
        { builder: p2Builder, label: 'p2' },
        { builder: p3Builder, label: 'p3' },
        { builder: p4Builder, label: 'p4' },
      ]);

      // Assert
      while (s.count() > 0) {
        expect(status.done).toBe(false);
        await s.waitOne();
      }
      expect(status.done).toBe(false);
      expect(status.faulty).toBe(true);
    });

    it('should execute schedule up to the first faulty task', async () => {
      // Arrange
      const p1Builder = jest.fn().mockResolvedValue(1);
      const p2Builder = jest.fn().mockResolvedValue(2);
      const p3Builder = jest.fn().mockRejectedValue(3);
      const p4Builder = jest.fn().mockResolvedValue(4);
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      s.scheduleSequence([
        { builder: p1Builder, label: 'p1' },
        { builder: p2Builder, label: 'p2' },
        { builder: p3Builder, label: 'p3' },
        { builder: p4Builder, label: 'p4' },
      ]);

      // Assert
      await s.waitAll();
      expect(p1Builder).toHaveBeenCalled();
      expect(p2Builder).toHaveBeenCalled();
      expect(p3Builder).toHaveBeenCalled();
      expect(p4Builder).not.toHaveBeenCalled();
    });

    it('should execute sequence in order', async () => {
      // Arrange
      const p1Builder = jest.fn().mockResolvedValue(1);
      const p2Builder = jest.fn().mockResolvedValue(2);
      const p3Builder = jest.fn().mockResolvedValue(3);
      const p4Builder = jest.fn().mockResolvedValue(4);
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      s.scheduleSequence([
        { builder: p1Builder, label: 'p1' },
        { builder: p2Builder, label: 'p2' },
        { builder: p3Builder, label: 'p3' },
        { builder: p4Builder, label: 'p4' },
      ]);

      // Assert
      expect(p1Builder).not.toHaveBeenCalled();
      expect(p2Builder).not.toHaveBeenCalled();
      expect(p3Builder).not.toHaveBeenCalled();
      expect(p4Builder).not.toHaveBeenCalled();
      await s.waitOne();
      expect(p1Builder).toHaveBeenCalled();
      expect(p2Builder).not.toHaveBeenCalled();
      expect(p3Builder).not.toHaveBeenCalled();
      expect(p4Builder).not.toHaveBeenCalled();
      await s.waitOne();
      expect(p1Builder).toHaveBeenCalled();
      expect(p2Builder).toHaveBeenCalled();
      expect(p3Builder).not.toHaveBeenCalled();
      expect(p4Builder).not.toHaveBeenCalled();
      await s.waitOne();
      expect(p1Builder).toHaveBeenCalled();
      expect(p2Builder).toHaveBeenCalled();
      expect(p3Builder).toHaveBeenCalled();
      expect(p4Builder).not.toHaveBeenCalled();
      await s.waitOne();
      expect(p1Builder).toHaveBeenCalled();
      expect(p2Builder).toHaveBeenCalled();
      expect(p3Builder).toHaveBeenCalled();
      expect(p4Builder).toHaveBeenCalled();
      expect(s.count()).toBe(0);
    });

    it('should wait the full completion of items coming from the scheduled sequence before taking any other scheduled promise', async () => {
      // Arrange
      const delay = () => new Promise((resolve) => setTimeout(resolve, 0));
      const p1BuilderSteps = { a: false, b: false, c: false, d: false };
      const p2Builder = jest.fn().mockResolvedValue(2);
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      s.scheduleSequence([
        {
          builder: () => {
            const complexSequenceItem = async () => {
              p1BuilderSteps.a = true;
              await delay();
              p1BuilderSteps.b = true;
              await delay();
              p1BuilderSteps.c = true;
              await delay();
              p1BuilderSteps.d = true;
            };
            return complexSequenceItem();
          },
          label: 'p1',
        },
        { builder: p2Builder, label: 'p2' },
      ]);

      // Assert
      expect(p1BuilderSteps).toEqual({ a: false, b: false, c: false, d: false });
      expect(p2Builder).not.toHaveBeenCalled();
      await s.waitOne();
      expect(p1BuilderSteps).toEqual({ a: true, b: true, c: true, d: true });
      expect(p2Builder).not.toHaveBeenCalled();
      await s.waitAll();
    });

    it('should show item name declared in sequence in toString', async () => {
      // Arrange
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      s.scheduleSequence([
        { builder: () => Promise.resolve(42), label: 'firstStep' },
        function anotherStep() {
          return Promise.resolve(48);
        },
        { builder: () => Promise.reject(1), label: 'rejectedStep' },
        { builder: () => Promise.resolve(8), label: 'neverCalled' },
      ]);

      // Assert
      await s.waitAll();
      expect(s.toString()).toMatchInlineSnapshot(`
          "schedulerFor()\`
          -> [task\${1}] sequence::firstStep resolved with value 42
          -> [task\${2}] sequence::anotherStep resolved with value 48
          -> [task\${3}] sequence::rejectedStep rejected with value 1\`"
        `);
      expect(s.count()).toBe(0);
    });

    it('should issue a task that resolves when the sequence ends successfully', async () => {
      // Arrange
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      let taskResolvedValue: { done: boolean; faulty: boolean } | null = null;
      const s = new SchedulerImplem(act, taskSelector);
      const { task } = s.scheduleSequence([
        { builder: () => Promise.resolve(42), label: 'firstStep' },
        { builder: () => Promise.resolve(8), label: 'secondStep' },
      ]);
      task.then((v) => (taskResolvedValue = v));

      // Assert
      while (s.count() !== 0) {
        expect(taskResolvedValue).toBe(null);
        await s.waitOne();
      }
      expect(taskResolvedValue).toEqual({ done: true, faulty: false });
    });

    it('should issue a task that resolves when the sequence fails', async () => {
      // Arrange
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      let taskResolvedValue: { done: boolean; faulty: boolean } | null = null;
      const s = new SchedulerImplem(act, taskSelector);
      const { task } = s.scheduleSequence([
        { builder: () => Promise.resolve(42), label: 'firstStep' },
        { builder: () => Promise.reject(8), label: 'secondStep' },
        { builder: () => Promise.resolve(8), label: 'neverCalledStep' },
      ]);
      task.then((v) => (taskResolvedValue = v));

      // Assert
      while (s.count() !== 0) {
        expect(taskResolvedValue).toBe(null);
        await s.waitOne();
      }
      expect(taskResolvedValue).toEqual({ done: false, faulty: true });
    });

    it('should attach passed metadata into the report', async () => {
      // Arrange
      const expectedMetadataFirst = Symbol('123');
      const expectedMetadataSecond = Symbol('1234');
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      s.scheduleSequence([
        { builder: () => Promise.resolve(42), label: 'firstStep', metadata: expectedMetadataFirst },
        { builder: () => Promise.reject(8), label: 'secondStep', metadata: expectedMetadataSecond },
      ]);

      // Assert
      await s.waitAll();
      const report = s.report();
      expect(report).toHaveLength(2);
      expect(report[0].status).toBe('resolved');
      expect(report[0].metadata).toBe(expectedMetadataFirst);
      expect(report[1].status).toBe('rejected');
      expect(report[1].metadata).toBe(expectedMetadataSecond);
    });

    it('should attach passed metadata into the report even if not executed', async () => {
      // Arrange
      const expectedMetadataFirst = Symbol('123');
      const expectedMetadataSecond = Symbol('1234');
      const act = jest.fn().mockImplementation((f) => f());
      const nextTaskIndex = jest.fn().mockReturnValue(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem(act, taskSelector);
      s.scheduleSequence([
        { builder: () => Promise.resolve(42), label: 'firstStep', metadata: expectedMetadataFirst },
        { builder: () => Promise.reject(8), label: 'secondStep', metadata: expectedMetadataSecond },
      ]);

      // Assert
      const report = s.report();
      expect(report).toHaveLength(1); // second task cannot be scheduled as first one is still pending
      expect(report[0].status).toBe('pending');
      expect(report[0].metadata).toBe(expectedMetadataFirst);
    });
  });
});

// Helpers

function buildSeededNextTaskIndex(seeds: fc.Stream<number>, nextTaskIndexLengths: number[] = []) {
  const nextTaskIndex = jest.fn().mockImplementation((scheduledTasks: ScheduledTask<unknown>[]) => {
    const seed = seeds.next();
    if (seed.done) {
      throw new Error('Stream for seeds exhausted');
    }
    if (scheduledTasks.length === 0) {
      throw new Error('Called without any task');
    }
    // `tasks` pointer being re-used from one call to another (mutate)
    // we cannot rely on toHaveBeenCalledWith
    nextTaskIndexLengths.push(scheduledTasks.length);
    return seed.value % scheduledTasks.length;
  });
  return nextTaskIndex;
}
