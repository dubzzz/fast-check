import { SchedulerArbitrary } from '../../../../src/arbitrary/_internals/SchedulerArbitrary';
import { fakeRandom } from '../../check/arbitrary/generic/RandomHelpers';

import * as SchedulerImplemMock from '../../../../src/arbitrary/_internals/implementations/SchedulerImplem';
import { ScheduledTask } from '../../../../src/arbitrary/_internals/implementations/SchedulerImplem';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
}
beforeEach(beforeEachHook);

describe('SchedulerArbitrary', () => {
  describe('generate', () => {
    it('should instanciate a SchedulerImplem on generate and clone the random generator', () => {
      // Arrange
      const act = jest.fn();
      const { instance: mrng, clone } = fakeRandom(); // random received by generate (risk to be altered from the outside so we clone it)
      const { instance: mrng1, clone: clone1 } = fakeRandom(); // random used by the first taskScheduler
      const { instance: mrng2 } = fakeRandom(); // random used by the clone of taskScheduler is needed
      clone.mockReturnValueOnce(mrng1);
      clone1.mockReturnValueOnce(mrng2);
      const fakeScheduler = {} as SchedulerImplemMock.SchedulerImplem<unknown>;
      const SchedulerImplem = jest.spyOn(SchedulerImplemMock, 'SchedulerImplem');
      SchedulerImplem.mockReturnValue(fakeScheduler);

      // Act
      const arb = new SchedulerArbitrary(act);
      const g = arb.generate(mrng, undefined);

      // Assert
      expect(g.value).toBe(fakeScheduler);
      expect(SchedulerImplem).toHaveBeenCalledTimes(1);
      expect(SchedulerImplem).toHaveBeenCalledWith(
        act,
        expect.objectContaining({ clone: expect.any(Function), nextTaskIndex: expect.any(Function) })
      );
      expect(clone).toHaveBeenCalledTimes(1);
      expect(clone1).toHaveBeenCalledTimes(1);
    });

    it('should build a taskScheduler pulling random values out of the cloned instance of Random', () => {
      // Arrange
      const act = jest.fn();
      const scheduledTasks = [{}, {}, {}, {}, {}, {}, {}, {}] as ScheduledTask<unknown>[];
      const { instance: mrng, clone } = fakeRandom();
      const { instance: mrng1, clone: clone1, nextInt } = fakeRandom();
      const { instance: mrng2 } = fakeRandom();
      clone.mockReturnValueOnce(mrng1);
      clone1.mockReturnValueOnce(mrng2);
      const fakeScheduler = {} as SchedulerImplemMock.SchedulerImplem<unknown>;
      const SchedulerImplem = jest.spyOn(SchedulerImplemMock, 'SchedulerImplem');
      SchedulerImplem.mockReturnValue(fakeScheduler);
      const arb = new SchedulerArbitrary(act);
      arb.generate(mrng, undefined);

      // Act
      const taskScheduler = SchedulerImplem.mock.calls[0][1];
      taskScheduler.nextTaskIndex(scheduledTasks);

      // Assert
      expect(nextInt).toHaveBeenCalledTimes(1);
      expect(nextInt).toHaveBeenCalledWith(0, scheduledTasks.length - 1);
    });

    it('should build a taskScheduler that can be cloned and create the same values', () => {
      // Arrange
      const act = jest.fn();
      const scheduledTasks = [{}, {}, {}, {}, {}, {}, {}, {}] as ScheduledTask<unknown>[];
      const { instance: mrng, clone } = fakeRandom();
      const { instance: mrng1, clone: clone1, nextInt } = fakeRandom();
      const { instance: mrng2, clone: clone2, nextInt: nextIntBis } = fakeRandom();
      const { instance: mrng3 } = fakeRandom();
      clone.mockReturnValueOnce(mrng1);
      clone1.mockImplementationOnce(() => {
        expect(nextInt).not.toHaveBeenCalled(); // if we pulled values clone is not a clone of the source
        return mrng2;
      });
      clone2.mockImplementationOnce(() => {
        expect(nextIntBis).not.toHaveBeenCalled(); // if we pulled values clone is not a clone of the source
        return mrng3;
      });
      nextInt.mockReturnValueOnce(5).mockReturnValueOnce(2);
      nextIntBis.mockReturnValueOnce(5).mockReturnValueOnce(2);
      const fakeScheduler = {} as SchedulerImplemMock.SchedulerImplem<unknown>;
      const SchedulerImplem = jest.spyOn(SchedulerImplemMock, 'SchedulerImplem');
      SchedulerImplem.mockReturnValue(fakeScheduler);
      const arb = new SchedulerArbitrary(act);
      arb.generate(mrng, undefined);

      // Act
      const taskScheduler = SchedulerImplem.mock.calls[0][1];
      const v1 = taskScheduler.nextTaskIndex(scheduledTasks);
      const v2 = taskScheduler.nextTaskIndex(scheduledTasks);
      const taskScheduler2 = taskScheduler.clone();
      const u1 = taskScheduler2.nextTaskIndex(scheduledTasks);
      const u2 = taskScheduler2.nextTaskIndex(scheduledTasks);

      // Assert
      expect(nextInt).toHaveBeenCalledTimes(2);
      expect(nextInt).toHaveBeenCalledWith(0, scheduledTasks.length - 1);
      expect(nextIntBis).toHaveBeenCalledTimes(2);
      expect(nextIntBis).toHaveBeenCalledWith(0, scheduledTasks.length - 1);
      expect(v1).toBe(u1);
      expect(v2).toBe(u2);
    });
  });

  describe('canShrinkWithoutContext', () => {
    it('should return false for any Scheduler received without any context (even for SchedulerImplem)', () => {
      // Arrange
      const act = jest.fn();

      // Act
      const arb = new SchedulerArbitrary(act);
      const out = arb.canShrinkWithoutContext(
        new SchedulerImplemMock.SchedulerImplem(act, { clone: jest.fn(), nextTaskIndex: jest.fn() })
      );

      // Assert
      expect(out).toBe(false);
    });

    it('should return false even for its own values', () => {
      // Arrange
      const act = jest.fn();
      const { instance: mrng, clone } = fakeRandom();
      const { instance: mrng1, clone: clone1 } = fakeRandom();
      const { instance: mrng2 } = fakeRandom();
      clone.mockReturnValueOnce(mrng1);
      clone1.mockReturnValueOnce(mrng2);

      // Act
      const arb = new SchedulerArbitrary(act);
      const g = arb.generate(mrng, undefined);
      const out = arb.canShrinkWithoutContext(g.value);

      // Assert
      expect(out).toBe(false);
    });
  });

  describe('shrink', () => {
    it('should always shrink to nil', () => {
      // Arrange
      const act = jest.fn();
      const { instance: mrng, clone } = fakeRandom();
      const { instance: mrng1, clone: clone1 } = fakeRandom();
      const { instance: mrng2 } = fakeRandom();
      clone.mockReturnValueOnce(mrng1);
      clone1.mockReturnValueOnce(mrng2);

      // Act
      const arb = new SchedulerArbitrary(act);
      const { value, context } = arb.generate(mrng, undefined);
      const shrinks = [...arb.shrink(value, context)];

      // Assert
      expect(shrinks).toHaveLength(0);
    });
  });
});
