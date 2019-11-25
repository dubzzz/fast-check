import { scheduler } from '../../../../src/check/arbitrary/AsyncSchedulerArbitrary';

import * as stubRng from '../../stubs/generators';

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
        const p3Builder = jest.fn().mockRejectedValue(3); // UnhandledPromiseRejectionWarning
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
        const p3Builder = jest.fn().mockRejectedValue(3); // UnhandledPromiseRejectionWarning
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
    });
  });
});
