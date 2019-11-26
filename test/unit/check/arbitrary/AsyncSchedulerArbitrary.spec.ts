import { scheduler } from '../../../../src/check/arbitrary/AsyncSchedulerArbitrary';

import * as stubRng from '../../stubs/generators';
import { Random } from '../../../../src/random/generator/Random';

import prand from 'pure-rand';
import { cloneMethod, hasCloneMethod } from '../../../../src/check/symbols';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AsyncSchedulerArbitrary', () => {
  describe('context', () => {
    describe('schedule', () => {
      it('Should postpone completion of promise but call it with right parameters in case of success', async () => {
        // Arrange
        const expectedThenValue = 123;
        const thenFunction = jest.fn();

        // Act
        const mrng = stubRng.mutable.counter(42);
        const s = scheduler().generate(mrng).value;
        s.schedule(Promise.resolve(expectedThenValue)).then(thenFunction);

        // Assert
        expect(s.count()).toBe(1);
        expect(thenFunction).not.toHaveBeenCalled();
        await s.waitOne();
        expect(thenFunction).toHaveBeenCalled();
        expect(thenFunction).toHaveBeenCalledTimes(1);
        expect(thenFunction).toHaveBeenCalledWith(expectedThenValue);
      });

      it('Should postpone completion of promise but call it with right parameters in case of failure', async () => {
        // Arrange
        const expectedThenValue = 123;
        const catchFunction = jest.fn();

        // Act
        const mrng = stubRng.mutable.counter(42);
        const s = scheduler().generate(mrng).value;
        s.schedule(Promise.reject(expectedThenValue)).then(() => {}, catchFunction);

        // Assert
        expect(s.count()).toBe(1);
        expect(catchFunction).not.toHaveBeenCalled();
        await s.waitOne();
        expect(catchFunction).toHaveBeenCalled();
        expect(catchFunction).toHaveBeenCalledTimes(1);
        expect(catchFunction).toHaveBeenCalledWith(expectedThenValue);
      });

      it('Should be able to schedule multiple promises', async () => {
        // Arrange
        const tasks = [Promise.resolve(1), Promise.resolve(8), Promise.resolve(2)];

        // Act
        const mrng = stubRng.mutable.counter(42);
        const s = scheduler().generate(mrng).value;
        for (const t of tasks) {
          s.schedule(t);
        }

        // Assert
        expect(s.count()).toBe(tasks.length);
        await s.waitAll();
        expect(s.count()).toBe(0);
      });

      it('Should be able to waitAll promises scheduling others', async () => {
        // Arrange
        const status = { done: false };
        const nothingResolved = {
          1: false,
          2: false,
          3: false,
          4: false,
          5: false
        };
        const resolved = { ...nothingResolved };

        // Act
        const mrng = stubRng.mutable.counter(42);
        const s = scheduler().generate(mrng).value;
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
            })
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
          5: true
        });
      });

      it('Should show both resolved, rejected and pending promises in toString', async () => {
        // Arrange

        // Act
        const mrng = new Random(
          new ControlledRandom([
            5, // task#6 resolved, state was: [0,1,2,3,4,5,6,7,8,9]
            5, // task#7 resolved, state was: [0,1,2,3,4,6,7,8,9]
            1, // task#2 resolved, state was: [0,1,2,3,4,7,8,9]
            0, // task#1 resolved, state was: [0,2,3,4,7,8,9]
            1, // task#4 resolved, state was: [2,3,4,7,8,9]
            2, // task#8 resolved, state was: [2,4,7,8,9]
            3, // task#10 resolved, state was: [2,4,8,9]
            0, // task#3 resolved, state was: [2,4,8]
            0, // task#5 resolved, state was: [4,8]
            0 // task#9 resolved, state was: [8]
          ])
        );
        const s = scheduler().generate(mrng).value;
        for (let idx = 0; idx !== 10; ++idx) {
          if (idx % 2 === 0) s.schedule(Promise.resolve(idx));
          else s.schedule(Promise.reject(idx));
        }

        // Assert
        expect(s.count()).toBe(10);
        expect(s.toString()).toMatchInlineSnapshot(`
          "Scheduler\`
          -> [task#1] promise pending
          -> [task#2] promise pending
          -> [task#3] promise pending
          -> [task#4] promise pending
          -> [task#5] promise pending
          -> [task#6] promise pending
          -> [task#7] promise pending
          -> [task#8] promise pending
          -> [task#9] promise pending
          -> [task#10] promise pending\`"
        `);
        await s.waitOne();
        await s.waitOne();
        await s.waitOne();
        expect(s.toString()).toMatchInlineSnapshot(`
          "Scheduler\`
          -> [task#6] promise rejected with value 5
          -> [task#7] promise resolved with value 6
          -> [task#2] promise rejected with value 1
          -> [task#1] promise pending
          -> [task#3] promise pending
          -> [task#4] promise pending
          -> [task#5] promise pending
          -> [task#8] promise pending
          -> [task#9] promise pending
          -> [task#10] promise pending\`"
        `);
        await s.waitOne();
        await s.waitOne();
        await s.waitOne();
        expect(s.toString()).toMatchInlineSnapshot(`
          "Scheduler\`
          -> [task#6] promise rejected with value 5
          -> [task#7] promise resolved with value 6
          -> [task#2] promise rejected with value 1
          -> [task#1] promise resolved with value 0
          -> [task#4] promise rejected with value 3
          -> [task#8] promise rejected with value 7
          -> [task#3] promise pending
          -> [task#5] promise pending
          -> [task#9] promise pending
          -> [task#10] promise pending\`"
        `);
        await s.waitOne();
        await s.waitOne();
        await s.waitOne();
        await s.waitOne();
        expect(s.toString()).toMatchInlineSnapshot(`
          "Scheduler\`
          -> [task#6] promise rejected with value 5
          -> [task#7] promise resolved with value 6
          -> [task#2] promise rejected with value 1
          -> [task#1] promise resolved with value 0
          -> [task#4] promise rejected with value 3
          -> [task#8] promise rejected with value 7
          -> [task#10] promise rejected with value 9
          -> [task#3] promise resolved with value 2
          -> [task#5] promise resolved with value 4
          -> [task#9] promise resolved with value 8\`"
        `);
        expect(s.count()).toBe(0);
      });

      it('Should properly replay schedule on cloned instance', async () => {
        // Arrange
        const promises = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
        const then1Function = jest.fn();
        const then2Function = jest.fn();

        // Act
        const mrng = new Random(new ControlledRandom([2, 0, 0]));
        const s1 = scheduler().generate(mrng).value;
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
    });

    describe('scheduleFunction', () => {
      it('Should schedule a new promise when calling a scheduled function', async () => {
        // Arrange
        const firstCallInput = 1;
        const expectedThenValue = 123;
        const thenFunction = jest.fn();

        // Act
        const mrng = stubRng.mutable.counter(42);
        const s = scheduler().generate(mrng).value;
        const scheduledFun = s.scheduleFunction(async id => id + expectedThenValue);

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

      it('Should be able to call a scheduled function multiple times', async () => {
        // Arrange
        const firstCallInput = 1;
        const secondCallInput = 10;
        const expectedThenValue = 123;
        const thenFunction = jest.fn();
        const then2Function = jest.fn();

        // Act
        const mrng = stubRng.mutable.counter(42);
        const s = scheduler().generate(mrng).value;
        const scheduledFun = s.scheduleFunction(async id => id + expectedThenValue);

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

      it('Should be able to waitAll for a scheduled function calling itself', async () => {
        // Arrange
        const firstCallInput = 10;
        const thenFunction = jest.fn();
        const thenImplem = (remaining: number) => {
          thenFunction();
          if (remaining <= 0) return;
          scheduledFun(remaining - 1).then(thenImplem);
        };

        // Act
        const mrng = stubRng.mutable.counter(42);
        const s = scheduler().generate(mrng).value;
        const scheduledFun = s.scheduleFunction(async id => id);

        // Assert
        expect(s.count()).toBe(0);
        scheduledFun(firstCallInput).then(thenImplem);
        await s.waitAll();
        expect(thenFunction).toHaveBeenCalledTimes(firstCallInput + 1);
      });

      it('Should show both resolved, rejected and pending promises in toString', async () => {
        // Arrange
        const calls: [number, number][] = [[0, 3], [1, 4], [6, 0]];

        // Act
        const mrng = new Random(
          new ControlledRandom([
            2, // task#3 resolved, state was: [0,1,2]
            0, // task#1 resolved, state was: [0,1]
            0 // task#2 resolved, state was: [1]
          ])
        );
        const s = scheduler().generate(mrng).value;
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
          "Scheduler\`
          -> [task#1] function::(0,3) pending
          -> [task#2] function::(1,4) pending
          -> [task#3] function::(6,0) pending\`"
        `);
        await s.waitOne();
        await s.waitOne();
        expect(s.toString()).toMatchInlineSnapshot(`
          "Scheduler\`
          -> [task#3] function::(6,0) rejected with value Error: Unexpected: 6 >= 0
          -> [task#1] function::(0,3) resolved with value 0
          -> [task#2] function::(1,4) pending\`"
        `);
        await s.waitOne();
        expect(s.toString()).toMatchInlineSnapshot(`
          "Scheduler\`
          -> [task#3] function::(6,0) rejected with value Error: Unexpected: 6 >= 0
          -> [task#1] function::(0,3) resolved with value 0
          -> [task#2] function::(1,4) resolved with value 1\`"
        `);
        expect(s.count()).toBe(0);
      });

      it('Should show function name if any in toString', async () => {
        // Arrange

        // Act
        const mrng = new Random(
          new ControlledRandom([
            2, // task#3 resolved, state was: [0,1,2]
            0, // task#1 resolved, state was: [0,1]
            0 // task#2 resolved, state was: [1]
          ])
        );
        const s = scheduler().generate(mrng).value;
        s.scheduleFunction(async function taskA() {
          return { response: 'dummy response for task A' };
        })();
        s.scheduleFunction(async function anotherTaskNameForB(input: number) {
          return 3;
        })(42);
        s.scheduleFunction(async function somethingElseForC(complexInstance: any, anotherInput: number) {
          return 'c';
        })({ a: { b: 5 }, c: 0 }, 4);

        // Assert
        expect(s.count()).toBe(3);
        expect(s.toString()).toMatchInlineSnapshot(`
          "Scheduler\`
          -> [task#1] function::taskA() pending
          -> [task#2] function::anotherTaskNameForB(42) pending
          -> [task#3] function::somethingElseForC({\\"a\\":{\\"b\\":5},\\"c\\":0},4) pending\`"
        `);
        await s.waitAll();
        expect(s.toString()).toMatchInlineSnapshot(`
          "Scheduler\`
          -> [task#3] function::somethingElseForC({\\"a\\":{\\"b\\":5},\\"c\\":0},4) resolved with value \\"c\\"
          -> [task#1] function::taskA() resolved with value {\\"response\\":\\"dummy response for task A\\"}
          -> [task#2] function::anotherTaskNameForB(42) resolved with value 3\`"
        `);
        expect(s.count()).toBe(0);
      });
    });

    describe('scheduleSequence', () => {
      it('Should accept empty sequences', async () => {
        // Arrange

        // Act
        const mrng = stubRng.mutable.counter(42);
        const s = scheduler().generate(mrng).value;
        const status = s.scheduleSequence([]);

        // Assert
        expect(s.count()).toBe(0);
        expect(status.done).toBe(true);
        expect(status.faulty).toBe(false);
      });

      it('Should consider a sequence as a serie of tasks and not parallel tasks', async () => {
        // Arrange
        const p1Builder = jest.fn().mockResolvedValue(1);
        const p2Builder = jest.fn().mockResolvedValue(2);
        const p3Builder = jest.fn().mockResolvedValue(3);
        const p4Builder = jest.fn().mockResolvedValue(4);

        // Act
        const mrng = stubRng.mutable.counter(42);
        const s = scheduler().generate(mrng).value;
        s.scheduleSequence([
          { builder: p1Builder, label: 'p1' },
          { builder: p2Builder, label: 'p2' },
          { builder: p3Builder, label: 'p3' },
          { builder: p4Builder, label: 'p4' }
        ]);

        // Assert
        expect(s.count()).toBe(1);
        await s.waitAll();
        expect(s.count()).toBe(0);
      });

      it('Should mark schedule as done at the end of the sequence but not faulty', async () => {
        // Arrange
        const p1Builder = jest.fn().mockResolvedValue(1);
        const p2Builder = jest.fn().mockResolvedValue(2);
        const p3Builder = jest.fn().mockResolvedValue(3);
        const p4Builder = jest.fn().mockResolvedValue(4);

        // Act
        const mrng = stubRng.mutable.counter(42);
        const s = scheduler().generate(mrng).value;
        const status = s.scheduleSequence([
          { builder: p1Builder, label: 'p1' },
          { builder: p2Builder, label: 'p2' },
          { builder: p3Builder, label: 'p3' },
          { builder: p4Builder, label: 'p4' }
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

      it('Should mark faulty schedule as not done but as faulty', async () => {
        // Arrange
        const p1Builder = jest.fn().mockResolvedValue(1);
        const p2Builder = jest.fn().mockResolvedValue(2);
        const p3Builder = jest.fn().mockRejectedValue(3);
        const p4Builder = jest.fn().mockResolvedValue(4);

        // Act
        const mrng = stubRng.mutable.counter(42);
        const s = scheduler().generate(mrng).value;
        const status = s.scheduleSequence([
          { builder: p1Builder, label: 'p1' },
          { builder: p2Builder, label: 'p2' },
          { builder: p3Builder, label: 'p3' },
          { builder: p4Builder, label: 'p4' }
        ]);

        // Assert
        while (s.count() > 0) {
          expect(status.done).toBe(false);
          await s.waitOne();
        }
        expect(status.done).toBe(false);
        expect(status.faulty).toBe(true);
      });

      it('Should execute schedule up to the first faulty task', async () => {
        // Arrange
        const p1Builder = jest.fn().mockResolvedValue(1);
        const p2Builder = jest.fn().mockResolvedValue(2);
        const p3Builder = jest.fn().mockRejectedValue(3);
        const p4Builder = jest.fn().mockResolvedValue(4);

        // Act
        const mrng = stubRng.mutable.counter(42);
        const s = scheduler().generate(mrng).value;
        s.scheduleSequence([
          { builder: p1Builder, label: 'p1' },
          { builder: p2Builder, label: 'p2' },
          { builder: p3Builder, label: 'p3' },
          { builder: p4Builder, label: 'p4' }
        ]);

        // Assert
        await s.waitAll();
        expect(p1Builder).toHaveBeenCalled();
        expect(p2Builder).toHaveBeenCalled();
        expect(p3Builder).toHaveBeenCalled();
        expect(p4Builder).not.toHaveBeenCalled();
      });

      it('Should execute sequence in order', async () => {
        // Arrange
        const p1Builder = jest.fn().mockResolvedValue(1);
        const p2Builder = jest.fn().mockResolvedValue(2);
        const p3Builder = jest.fn().mockResolvedValue(3);
        const p4Builder = jest.fn().mockResolvedValue(4);

        // Act
        const mrng = stubRng.mutable.counter(42);
        const s = scheduler().generate(mrng).value;
        s.scheduleSequence([
          { builder: p1Builder, label: 'p1' },
          { builder: p2Builder, label: 'p2' },
          { builder: p3Builder, label: 'p3' },
          { builder: p4Builder, label: 'p4' }
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

      it('Should wait the full completion of items coming from the scheduled sequence before taking any other scheduled promise', async () => {
        // Arrange
        const delay = () => new Promise(resolve => setTimeout(resolve, 0));
        const p1BuilderSteps = { a: false, b: false, c: false, d: false };
        const p2Builder = jest.fn().mockResolvedValue(2);

        // Act
        const mrng = stubRng.mutable.counter(48);
        const s = scheduler().generate(mrng).value;
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
            label: 'p1'
          },
          { builder: p2Builder, label: 'p2' }
        ]);

        // Assert
        expect(p1BuilderSteps).toEqual({ a: false, b: false, c: false, d: false });
        expect(p2Builder).not.toHaveBeenCalled();
        await s.waitOne();
        expect(p1BuilderSteps).toEqual({ a: true, b: true, c: true, d: true });
        expect(p2Builder).not.toHaveBeenCalled();
        await s.waitAll();
      });

      it('Should show item name declared in sequence in toString', async () => {
        // Arrange

        // Act
        const mrng = stubRng.mutable.counter(48);
        const s = scheduler().generate(mrng).value;
        s.scheduleSequence([
          { builder: () => Promise.resolve(42), label: 'firstStep' },
          function anotherStep() {
            return Promise.resolve(48);
          },
          { builder: () => Promise.reject(1), label: 'rejectedStep' },
          { builder: () => Promise.resolve(8), label: 'neverCalled' }
        ]);

        // Assert
        await s.waitAll();
        expect(s.toString()).toMatchInlineSnapshot(`
          "Scheduler\`
          -> [task#1] sequence::firstStep resolved with value 42
          -> [task#2] sequence::anotherStep resolved with value 48
          -> [task#3] sequence::rejectedStep rejected with value 1\`"
        `);
        expect(s.count()).toBe(0);
      });
    });
  });
});

// Helpers

class ControlledRandom implements prand.RandomGenerator {
  constructor(private readonly values: number[], private readonly offset: number = 0) {}
  next(): [number, prand.RandomGenerator] {
    return [this.values[this.offset], new ControlledRandom(this.values, this.offset + 1)];
  }
  min(): number {
    return 0x00000000;
  }
  max(): number {
    return 0x7fffffff;
  }
}
