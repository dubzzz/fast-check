import fc from 'fast-check';
import type {
  ScheduledTask,
  TaskSelector,
} from '../../../../../src/arbitrary/_internals/implementations/SchedulerImplem';
import { SchedulerImplem } from '../../../../../src/arbitrary/_internals/implementations/SchedulerImplem';
import type { Scheduler } from '../../../../../src/arbitrary/_internals/interfaces/Scheduler';
import { cloneMethod, hasCloneMethod } from '../../../../../src/check/symbols';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

const buildUnresolved = () => {
  let resolved = false;
  let resolve = () => {};
  const p = new Promise<void>(
    (r) =>
      (resolve = () => {
        resolved = true;
        r();
      }),
  );
  return { p, resolve, hasBeenResolved: () => resolved };
};
const delay = () => new Promise((r) => setTimeout(r, 0));

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

    it('should wait the end of global act before resolving waitOne', async () => {
      // Arrange
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

    it('should wait the end of the wait-level act before resolving waitOne', async () => {
      // Arrange
      const p1 = buildUnresolved();
      const p2 = buildUnresolved();
      const globalAct = jest.fn().mockImplementation((f) => f());
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
      const s = new SchedulerImplem(globalAct, taskSelector);
      s.schedule(Promise.resolve(1)).then(() => (promiseResolved = true));

      // Assert
      expect(globalAct).not.toHaveBeenCalled();
      s.waitOne(act).then(() => (waitOneResolved = true));
      expect(globalAct).toHaveBeenCalledTimes(1);
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

    it('should wait the end of the local act before resolving waitOne', async () => {
      // Arrange
      const p1 = buildUnresolved();
      const p2 = buildUnresolved();
      const globalAct = jest.fn().mockImplementation((f) => f());
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
      const s = new SchedulerImplem(globalAct, taskSelector);
      s.schedule(Promise.resolve(1), undefined, undefined, act).then(() => (promiseResolved = true));

      // Assert
      expect(globalAct).not.toHaveBeenCalled();
      s.waitOne().then(() => (waitOneResolved = true));
      expect(globalAct).toHaveBeenCalledTimes(1);
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
        }),
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
        }),
      ));
  });

  describe('waitFor', () => {
    it('should not release any of the scheduled promises if the task has already been resolved', async () => {
      // Arrange
      const p1 = buildUnresolved();
      const p2 = buildUnresolved();
      const nextTaskIndex = jest.fn();
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };
      const awaitedTaskValue = Symbol();
      const awaitedTask = Promise.resolve(awaitedTaskValue);

      // Act
      const s = new SchedulerImplem((f) => f(), taskSelector);
      s.schedule(p1.p);
      s.schedule(p2.p);

      // Assert
      const value = await s.waitFor(awaitedTask);
      expect(value).toBe(awaitedTaskValue);
      expect(nextTaskIndex).not.toHaveBeenCalled();
      expect(s.count()).toBe(2); // Still two pending scheduled tasks (none released yet)
    });

    it('should stop releasing scheduled promises as soon as the task resolves', async () => {
      // Arrange
      const p1 = buildUnresolved();
      const p2 = buildUnresolved();
      const p3 = buildUnresolved();
      const nextTaskIndexParams: unknown[] = [];
      const nextTaskIndex = jest
        .fn()
        .mockImplementationOnce((scheduledTasks) => {
          nextTaskIndexParams.push([...scheduledTasks]); // need to clone it as it will be altered
          return 1;
        })
        .mockImplementationOnce((scheduledTasks) => {
          nextTaskIndexParams.push([...scheduledTasks]);
          return 0;
        });
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem((f) => f(), taskSelector);
      const sp1 = s.schedule(p1.p);
      s.schedule(p2.p);
      s.schedule(p3.p);
      const awaitedTask = sp1.then(() => Symbol());

      // Assert
      let waitForEnded = false;
      s.waitFor(awaitedTask).finally(() => (waitForEnded = true));
      await delay();
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).toHaveBeenCalledTimes(1);
      expect(nextTaskIndexParams[0]).toEqual([
        expect.objectContaining({ original: p1.p, taskId: 1 }),
        expect.objectContaining({ original: p2.p, taskId: 2 }),
        expect.objectContaining({ original: p3.p, taskId: 3 }),
      ]);

      // nextTaskIndex returned 1, so p2 scheduled
      p2.resolve();
      await delay();
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).toHaveBeenCalledTimes(2);
      expect(nextTaskIndexParams[1]).toEqual([
        expect.objectContaining({ original: p1.p, taskId: 1 }),
        expect.objectContaining({ original: p3.p, taskId: 3 }),
      ]);

      // nextTaskIndex returned 1, so p1 scheduled
      // We do not wait for p3 as it is not needed for the computation of awaitedTask
      p1.resolve();
      await delay();
      expect(waitForEnded).toBe(true);
      expect(nextTaskIndex).toHaveBeenCalledTimes(2); // no other call received
      expect(s.count()).toBe(1); // Still one pending scheduled task
    });

    it('should wait any released scheduled task to end even if the one we waited for resolved on its own', async () => {
      // Arrange
      const p1 = buildUnresolved();
      const pAwaited = buildUnresolved();
      const nextTaskIndex = jest.fn().mockReturnValueOnce(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem((f) => f(), taskSelector);
      s.schedule(p1.p);

      // Assert
      let waitForEnded = false;
      s.waitFor(pAwaited.p).finally(() => (waitForEnded = true));
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).not.toHaveBeenCalled(); // not called synchronously
      await delay();
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).toHaveBeenCalledTimes(1);

      // Let's resolve waiated task
      pAwaited.resolve();
      await delay();
      expect(waitForEnded).toBe(false); // should not be visible yet as we need to wait the running one

      // Let's resolve running one
      p1.resolve();
      await delay();
      expect(waitForEnded).toBe(true);
      expect(s.count()).toBe(0); // No pending scheduled task
    });

    it('should wait and release scheduled tasks coming after the call to waitFor', async () => {
      // Arrange
      const p1 = buildUnresolved();
      const nextTaskIndex = jest.fn().mockReturnValueOnce(0);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };
      let resolveAwaitedTask: () => void;
      const awaitedTask = new Promise<void>((r) => (resolveAwaitedTask = r));

      // Act
      const s = new SchedulerImplem((f) => f(), taskSelector);

      // Assert
      let waitForEnded = false;
      s.waitFor(awaitedTask).finally(() => (waitForEnded = true));
      await delay();
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).not.toHaveBeenCalled(); // nothing scheduled yet

      // Schedule p1 a requirement for our resulting task
      s.schedule(p1.p).then(() => resolveAwaitedTask());
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).not.toHaveBeenCalled(); // no synchronous trigger
      await delay();
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).toHaveBeenCalledTimes(1);

      // Releasing p1 should release the main task
      p1.resolve();
      await delay();
      expect(waitForEnded).toBe(true);
      expect(nextTaskIndex).toHaveBeenCalledTimes(1);
      expect(s.count()).toBe(0); // No more pending scheduled task, all have been released
    });

    it('should accept multiple tasks to be scheduled together after the call to waitFor', async () => {
      // Arrange
      const p1 = buildUnresolved();
      const p2 = buildUnresolved();
      const nextTaskIndexParams: unknown[] = [];
      const nextTaskIndex = jest.fn().mockImplementation((scheduledTasks) => {
        nextTaskIndexParams.push([...scheduledTasks]); // We need to clone it as it will be altered after the call
        return 0;
      });
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };
      let resolveAwaitedTask: () => void;
      const awaitedTask = new Promise<void>((r) => (resolveAwaitedTask = r));

      // Act
      const s = new SchedulerImplem((f) => f(), taskSelector);

      // Assert
      let waitForEnded = false;
      s.waitFor(awaitedTask).finally(() => (waitForEnded = true));
      await delay();
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).not.toHaveBeenCalled(); // nothing scheduled yet

      // Schedule p1 and p2, requirements for our resulting task
      Promise.all([s.schedule(p1.p), s.schedule(p2.p)]).then(() => resolveAwaitedTask());
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).not.toHaveBeenCalled(); // no synchronous trigger
      await delay();
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).toHaveBeenCalledTimes(1);
      expect(nextTaskIndexParams[0]).toEqual([
        expect.objectContaining({ original: p1.p }),
        expect.objectContaining({ original: p2.p }),
      ]);

      // Releasing p1 should trigger the call to schedule p2 (main not released yet)
      p1.resolve();
      await delay();
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).toHaveBeenCalledTimes(2);
      expect(nextTaskIndexParams[1]).toEqual([expect.objectContaining({ original: p2.p })]);

      // Both p1 and p2 have been released so main has also been released
      p2.resolve();
      await delay();
      expect(waitForEnded).toBe(true);
      expect(nextTaskIndex).toHaveBeenCalledTimes(2);
      expect(s.count()).toBe(0); // No more pending scheduled task, all have been released
    });

    it('should accept multiple tasks to be scheduled together even if coming from distinct immediately resolved promises after the call to waitFor', async () => {
      // Arrange
      const p1 = Promise.resolve(1);
      const p2 = Promise.resolve(2);
      const nextTaskIndexParams: unknown[] = [];
      const nextTaskIndex = jest.fn().mockImplementation((scheduledTasks) => {
        nextTaskIndexParams.push([...scheduledTasks]); // We need to clone it as it will be altered after the call
        return 0;
      });
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };
      let resolveAwaitedTask: () => void;
      const awaitedTask = new Promise<void>((r) => (resolveAwaitedTask = r));

      // Act
      const s = new SchedulerImplem((f) => f(), taskSelector);

      // Assert
      let waitForEnded = false;
      s.waitFor(awaitedTask).finally(() => (waitForEnded = true));
      await delay();
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).not.toHaveBeenCalled(); // nothing scheduled yet

      // Schedule p1 and p2 in a very close futur, requirements for our resulting task
      const delayedP1Scheduling = Promise.resolve().then(() => s.schedule(p1));
      const delayedP2Scheduling = Promise.resolve().then(() => s.schedule(p2));
      Promise.all([delayedP1Scheduling, delayedP2Scheduling]).then(() => resolveAwaitedTask());
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).not.toHaveBeenCalled(); // no synchronous trigger
      await delay();
      expect(waitForEnded).toBe(true);
      expect(nextTaskIndex).toHaveBeenCalledTimes(2);
      expect(nextTaskIndexParams[0]).toEqual([
        expect.objectContaining({ original: p1 }),
        expect.objectContaining({ original: p2 }),
      ]);
      expect(nextTaskIndexParams[1]).toEqual([expect.objectContaining({ original: p2 })]);
      expect(s.count()).toBe(0); // No more pending scheduled task, all have been released
    });

    it('should consider separately tasks scheduled via different timeouts after the call to waitFor', async () => {
      // Arrange
      const p1 = Promise.resolve(1);
      const p2 = Promise.resolve(2);
      const nextTaskIndexParams: unknown[] = [];
      const nextTaskIndex = jest.fn().mockImplementation((scheduledTasks) => {
        nextTaskIndexParams.push([...scheduledTasks]); // We need to clone it as it will be altered after the call
        return 0;
      });
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };
      let resolveAwaitedTask: () => void;
      const awaitedTask = new Promise<void>((r) => (resolveAwaitedTask = r));

      // Act
      const s = new SchedulerImplem((f) => f(), taskSelector);

      // Assert
      let waitForEnded = false;
      s.waitFor(awaitedTask).finally(() => (waitForEnded = true));
      await delay();
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).not.toHaveBeenCalled(); // nothing scheduled yet

      // Schedule p1 and p2 in a very close futur, requirements for our resulting task
      const delayedP1Scheduling = delay().then(() => s.schedule(p1));
      const delayedP2Scheduling = delay().then(() => s.schedule(p2));
      Promise.all([delayedP1Scheduling, delayedP2Scheduling]).then(() => resolveAwaitedTask());
      expect(waitForEnded).toBe(false);
      expect(nextTaskIndex).not.toHaveBeenCalled(); // no synchronous trigger
      await delay();
      expect(waitForEnded).toBe(true);
      expect(nextTaskIndex).toHaveBeenCalledTimes(2);
      expect(nextTaskIndexParams[0]).toEqual([expect.objectContaining({ original: p1 })]);
      expect(nextTaskIndexParams[1]).toEqual([expect.objectContaining({ original: p2 })]);
      expect(s.count()).toBe(0); // No more pending scheduled task, all have been released
    });

    it('should forward exception thrown by the awaited task', async () => {
      // Arrange
      const nextTaskIndex = jest.fn();
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };
      const awaitedTaskValue = new Error('thrown by awaited');
      const awaitedTask = Promise.reject(awaitedTaskValue);

      // Act
      const s = new SchedulerImplem((f) => f(), taskSelector);

      // Assert
      await expect(() => s.waitFor(awaitedTask)).rejects.toThrow(awaitedTaskValue);
    });

    it('should be able to wait for a task being itself a scheduled one (no priority to release it first)', async () => {
      // Arrange
      const p1 = Promise.resolve(1);
      const p2 = Promise.resolve(2);
      const nextTaskIndex = jest.fn().mockReturnValueOnce(0).mockReturnValueOnce(1);
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };
      const awaitedTaskValue = Symbol();
      const awaitedTask = Promise.resolve(awaitedTaskValue);

      // Act
      const s = new SchedulerImplem((f) => f(), taskSelector);
      s.schedule(p1);
      s.schedule(p2);

      // Assert
      const value = await s.waitFor(s.schedule(awaitedTask));
      expect(value).toBe(awaitedTaskValue);
      expect(nextTaskIndex).toHaveBeenCalledTimes(2);
      expect(s.count()).toBe(1); // Still one pending scheduled task (only p1 has been released before the one we waited for)
    });

    it('should not release multiple scheduled tasks at the same time even if called via multiple waitFor', async () => {
      // Arrange
      const p1 = buildUnresolved();
      const p2 = buildUnresolved();
      const p3 = buildUnresolved();
      const p4 = buildUnresolved();
      const nextTaskIndex = jest
        .fn()
        .mockReturnValueOnce(1) // releasing p2 in [p1,p2,p3,p4]
        .mockReturnValueOnce(2) // releasing p4 in [p1,p3,p4]
        .mockReturnValueOnce(0); // releasing p1 in [p1,p4]
      const taskSelector: TaskSelector<unknown> = { clone: jest.fn(), nextTaskIndex };

      // Act
      const s = new SchedulerImplem((f) => f(), taskSelector);
      const sp1 = s.schedule(p1.p);
      const sp2 = s.schedule(p2.p);
      s.schedule(p3.p);
      s.schedule(p4.p);
      const awaitedTask1 = sp1.then(() => Symbol());
      const awaitedTask2 = sp2.then(() => Symbol());

      // Assert
      let waitForEnded1 = false;
      let waitForEnded2 = false;
      s.waitFor(awaitedTask1).finally(() => (waitForEnded1 = true));
      s.waitFor(awaitedTask2).finally(() => (waitForEnded2 = true));
      await delay();
      expect(waitForEnded1).toBe(false);
      expect(waitForEnded2).toBe(false);
      expect(nextTaskIndex).toHaveBeenCalledTimes(1);

      // p2 released, let's resolve it
      p2.resolve();
      await delay();
      expect(waitForEnded1).toBe(false);
      expect(waitForEnded2).toBe(true);
      expect(nextTaskIndex).toHaveBeenCalledTimes(2);

      // p4 released, let's resolve it
      p4.resolve();
      await delay();
      expect(waitForEnded1).toBe(false);
      expect(waitForEnded2).toBe(true);
      expect(nextTaskIndex).toHaveBeenCalledTimes(3);

      // p1 released, let's resolve it
      p1.resolve();
      await delay();
      expect(waitForEnded1).toBe(true);
      expect(waitForEnded2).toBe(true);
      expect(nextTaskIndex).toHaveBeenCalledTimes(3); // no other call received
      expect(s.count()).toBe(1); // Still one pending scheduled task for p3
    });

    it('should end whenever possible while never launching multiple tasks at the same time', async () => {
      const schedulingTypeArb = fc.constantFrom(...(['none', 'init'] as const));
      const dependenciesArbFor = (currentItem: number) =>
        fc.uniqueArray(fc.nat({ max: currentItem - 2 }), { maxLength: currentItem - 1 });
      const buildAndAddScheduled = (
        s: SchedulerImplem<unknown>,
        unscheduled: Promise<unknown>,
        allPs: Promise<unknown>[],
        dependencies: number[],
        schedulingType: 'none' | 'init',
      ) => {
        const label = `p${allPs.length + 1}:${JSON.stringify(dependencies)}`;
        const deps = dependencies.map((id) => allPs[id]);
        let self: Promise<unknown>;
        if (schedulingType === 'init') {
          if (deps.length === 0) {
            self = s.schedule(unscheduled, label);
          } else {
            self = Promise.all(deps).then(() => s.schedule(unscheduled, label));
          }
        } else {
          self = deps.length !== 0 ? Promise.all([...deps, unscheduled]) : unscheduled;
        }
        allPs.push(self);
      };
      const scheduleResolution = (
        wrappingScheduler: fc.Scheduler<unknown>,
        p: ReturnType<typeof buildUnresolved>,
        pName: string,
        directResolved: boolean,
        ctx: fc.ContextValue,
      ): void => {
        if (directResolved) {
          ctx.log(`${pName} resolved (direct)`);
          p.resolve();
          return;
        }
        wrappingScheduler.schedule(Promise.resolve(`Resolve ${pName}`)).then(() => {
          ctx.log(`${pName} resolved`);
          p.resolve();
        });
      };
      await fc.assert(
        fc.asyncProperty(
          // Scheduler not being tested itself, it will be used to schedule when task will resolve
          fc.scheduler(),
          // Stream of positive integers used to tell which task should be selected by `nextTaskIndex`
          // whenever asked for the next task to be scheduled
          fc.infiniteStream(fc.nat()),
          // Define the tree of pre-requisite tasks:
          // - type of scheduling: should they be scheduled within the Schduler under test?
          // - when should they resolved: on init or when `fc.scheduler` decides it?
          // - what are the dependencies needed for this task?
          fc.tuple(schedulingTypeArb, fc.boolean()),
          fc.tuple(schedulingTypeArb, fc.boolean(), dependenciesArbFor(2)),
          fc.tuple(schedulingTypeArb, fc.boolean(), dependenciesArbFor(3)),
          fc.tuple(schedulingTypeArb, fc.boolean(), dependenciesArbFor(4)),
          fc.tuple(schedulingTypeArb, fc.boolean(), dependenciesArbFor(5)),
          fc.tuple(fc.boolean(), dependenciesArbFor(6)),
          fc.tuple(fc.boolean(), dependenciesArbFor(6)),
          fc.tuple(fc.boolean(), dependenciesArbFor(6)),
          // Extra boolean values used to add some delays between resolved Promises and next ones
          fc.infiniteStream(fc.boolean()),
          // Logger for easier troubleshooting
          fc.context(),
          async (
            wrappingScheduler,
            nextTaskIndexSeed,
            [schedulingType1, directResolve1],
            [schedulingType2, directResolve2, dependencies2],
            [schedulingType3, directResolve3, dependencies3],
            [schedulingType4, directResolve4, dependencies4],
            [schedulingType5, directResolve5, dependencies5],
            [directResolveA, finalDependenciesA],
            [directResolveB, finalDependenciesB],
            [directResolveC, finalDependenciesC],
            addExtraDelays,
            ctx,
          ) => {
            // Arrange
            const p1 = buildUnresolved();
            const p2 = buildUnresolved();
            const p3 = buildUnresolved();
            const p4 = buildUnresolved();
            const p5 = buildUnresolved();
            const rawAllPs = [p1, p2, p3, p4, p5];
            const pAwaitedA = buildUnresolved();
            const pAwaitedB = buildUnresolved();
            const pAwaitedC = buildUnresolved();
            let unknownTaskReleased = false;
            let multipleTasksReleasedAtTheSameTime: string | undefined = undefined;
            let alreadyRunningPx: typeof p1 | undefined = undefined;
            const taskSelector: TaskSelector<unknown> = {
              clone: jest.fn(),
              nextTaskIndex: (scheduledTasks) => {
                const selectedId = nextTaskIndexSeed.next().value % scheduledTasks.length;
                const selectedPx = rawAllPs.find((p) => p.p === scheduledTasks[selectedId].original);
                const newPx = `p${rawAllPs.indexOf(selectedPx!) + 1}`;
                ctx.log(`Releasing ${newPx}${selectedPx!.hasBeenResolved() ? ' (resolved)' : ''}`);

                if (
                  multipleTasksReleasedAtTheSameTime === undefined &&
                  alreadyRunningPx !== undefined &&
                  !alreadyRunningPx.hasBeenResolved()
                ) {
                  const oldPx = `p${rawAllPs.indexOf(alreadyRunningPx) + 1}`;
                  multipleTasksReleasedAtTheSameTime = `${oldPx} already running when releasing ${newPx}`;
                }
                alreadyRunningPx = selectedPx;
                unknownTaskReleased = unknownTaskReleased || alreadyRunningPx === undefined;
                return selectedId;
              },
            };
            const s = new SchedulerImplem((f) => f(), taskSelector);
            const allPs: Promise<unknown>[] = [];
            buildAndAddScheduled(s, p1.p, allPs, [], schedulingType1);
            buildAndAddScheduled(s, p2.p, allPs, dependencies2, schedulingType2);
            buildAndAddScheduled(s, p3.p, allPs, dependencies3, schedulingType3);
            buildAndAddScheduled(s, p4.p, allPs, dependencies4, schedulingType4);
            buildAndAddScheduled(s, p5.p, allPs, dependencies5, schedulingType5);
            const awaitedTaskA = Promise.all([...finalDependenciesA.map((id) => allPs[id]), pAwaitedA.p]);
            let resolvedA = false;
            s.waitFor(awaitedTaskA).then(() => {
              ctx.log(`A ended`);
              resolvedA = true;
            });
            const awaitedTaskB = Promise.all([...finalDependenciesB.map((id) => allPs[id]), pAwaitedB.p]);
            let resolvedB = false;
            s.waitFor(awaitedTaskB).then(() => {
              ctx.log(`B ended`);
              resolvedB = true;
            });
            const awaitedTaskC = Promise.all([...finalDependenciesC.map((id) => allPs[id]), pAwaitedC.p]);
            let resolvedC = false;
            s.waitFor(awaitedTaskC).then(() => {
              ctx.log(`C ended`);
              resolvedC = true;
            });

            // Act
            scheduleResolution(wrappingScheduler, p1, 'p1', directResolve1, ctx);
            scheduleResolution(wrappingScheduler, p2, 'p2', directResolve2, ctx);
            scheduleResolution(wrappingScheduler, p3, 'p3', directResolve3, ctx);
            scheduleResolution(wrappingScheduler, p4, 'p4', directResolve4, ctx);
            scheduleResolution(wrappingScheduler, p5, 'p5', directResolve5, ctx);
            scheduleResolution(wrappingScheduler, pAwaitedA, 'pAwaitedA', directResolveA, ctx);
            scheduleResolution(wrappingScheduler, pAwaitedB, 'pAwaitedB', directResolveB, ctx);
            scheduleResolution(wrappingScheduler, pAwaitedC, 'pAwaitedC', directResolveC, ctx);

            while (wrappingScheduler.count() > 0) {
              // Extra delays based on timeouts of 0ms can potentially trigger unwanted bugs: let's try to add some before waitOne.
              if (addExtraDelays.next().value) {
                await delay();
              }
              await wrappingScheduler.waitOne();
            }
            // Extra delay done after all the scheduling as wrappingScheduler only schedules triggers to resolve tasks
            // and never waits for their associated Promises to really resolve.
            await delay();

            // Assert
            // All awaited tasks should have resolved
            expect(resolvedA).toBe(true);
            expect(resolvedB).toBe(true);
            expect(resolvedC).toBe(true);
            // Only one scheduled task awaited by the scheduler at a given point in time
            expect(multipleTasksReleasedAtTheSameTime).toBe(undefined);
            // Only known tasks could be scheduled
            expect(unknownTaskReleased).toBe(false);
          },
        ),
      );
    });
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
        }),
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
                  fc.constant<ExecutionPlan[]>([]),
                  fc.array(tie('self') as fc.Arbitrary<ExecutionPlan>),
                ),
              }),
            })).self,
            { minLength: 1 },
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
          },
        ),
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
        -> [task\${3}] function::(6,0) rejected with value new Error("Unexpected: 6 >= 0")
        -> [task\${1}] function::(0,3) resolved with value 0
        -> [task\${2}] function::(1,4) pending\`"
      `);
      await s.waitOne();
      expect(s.toString()).toMatchInlineSnapshot(`
        "schedulerFor()\`
        -> [task\${3}] function::(6,0) rejected with value new Error("Unexpected: 6 >= 0")
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
          -> [task\${3}] function::somethingElseForC({"a":{"b":5},"c":0},4) pending\`"
        `);
      await s.waitAll();
      expect(s.toString()).toMatchInlineSnapshot(`
          "schedulerFor()\`
          -> [task\${3}] function::somethingElseForC({"a":{"b":5},"c":0},4) resolved with value "c"
          -> [task\${1}] function::taskA() resolved with value {"response":"dummy response for task A"}
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
