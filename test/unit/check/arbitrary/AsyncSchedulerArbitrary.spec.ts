import { scheduler } from '../../../../src/check/arbitrary/AsyncSchedulerArbitrary';

import * as stubRng from '../../stubs/generators';

describe('AsyncSchedulerArbitrary', () => {
  describe('context', () => {
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
