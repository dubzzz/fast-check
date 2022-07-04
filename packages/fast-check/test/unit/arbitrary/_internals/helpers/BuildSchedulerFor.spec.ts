import { buildSchedulerFor } from '../../../../../src/arbitrary/_internals/helpers/BuildSchedulerFor';

import * as SchedulerImplemMock from '../../../../../src/arbitrary/_internals/implementations/SchedulerImplem';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
}
beforeEach(beforeEachHook);

describe('buildSchedulerFor', () => {
  it('should instantiate a SchedulerImplem', () => {
    // Arrange
    const instance = {} as SchedulerImplemMock.SchedulerImplem<unknown>;
    const SchedulerImplem = jest.spyOn(SchedulerImplemMock, 'SchedulerImplem');
    SchedulerImplem.mockImplementation(() => instance);
    const act = jest.fn();

    // Act
    const s = buildSchedulerFor(act, []);

    // Assert
    expect(s).toBe(instance);
    expect(SchedulerImplem).toHaveBeenCalledWith(
      act,
      expect.objectContaining({ clone: expect.any(Function), nextTaskIndex: expect.any(Function) })
    );
  });

  it('should create a taskSelector returning the requested ordering', () => {
    // Arrange
    const instance = {} as SchedulerImplemMock.SchedulerImplem<unknown>;
    const SchedulerImplem = jest.spyOn(SchedulerImplemMock, 'SchedulerImplem');
    SchedulerImplem.mockImplementation(() => instance);
    const act = jest.fn();
    const requestedOrder = [4, 1, 2, 0];
    const fakeLongScheduledTasks = [
      { taskId: 0 },
      { taskId: 1 },
      { taskId: 2 },
      { taskId: 3 },
      { taskId: 4 },
    ] as SchedulerImplemMock.ScheduledTask<unknown>[];

    // Act
    buildSchedulerFor(act, requestedOrder);
    const taskSelector = SchedulerImplem.mock.calls[0][1];

    // Assert
    expect(taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[0]);
    expect(taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[1]);
    expect(taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[2]);
    expect(taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[3]);
  });

  it('should create a taskSelector throwing in case the requested task does not exist', () => {
    // Arrange
    const instance = {} as SchedulerImplemMock.SchedulerImplem<unknown>;
    const SchedulerImplem = jest.spyOn(SchedulerImplemMock, 'SchedulerImplem');
    SchedulerImplem.mockImplementation(() => instance);
    const act = jest.fn();
    const requestedOrder = [4, 1, 2, 10];
    const fakeLongScheduledTasks = [
      { taskId: 0 },
      { taskId: 1 },
      { taskId: 2 },
      { taskId: 3 },
      { taskId: 4 },
    ] as SchedulerImplemMock.ScheduledTask<unknown>[];

    // Act
    buildSchedulerFor(act, requestedOrder);
    const taskSelector = SchedulerImplem.mock.calls[0][1];

    // Assert
    expect(taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[0]);
    expect(taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[1]);
    expect(taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[2]);
    expect(() => taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toThrowErrorMatchingInlineSnapshot(
      `"Invalid schedulerFor defined: unable to find next task"`
    );
  });

  it('should create a taskSelector throwing when exhausted and asked for another value', () => {
    // Arrange
    const instance = {} as SchedulerImplemMock.SchedulerImplem<unknown>;
    const SchedulerImplem = jest.spyOn(SchedulerImplemMock, 'SchedulerImplem');
    SchedulerImplem.mockImplementation(() => instance);
    const act = jest.fn();
    const requestedOrder = [4, 1, 2];
    const fakeLongScheduledTasks = [
      { taskId: 0 },
      { taskId: 1 },
      { taskId: 2 },
      { taskId: 3 },
      { taskId: 4 },
    ] as SchedulerImplemMock.ScheduledTask<unknown>[];

    // Act
    buildSchedulerFor(act, requestedOrder);
    const taskSelector = SchedulerImplem.mock.calls[0][1];

    // Assert
    expect(taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[0]);
    expect(taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[1]);
    expect(taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[2]);
    expect(() => taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toThrowErrorMatchingInlineSnapshot(
      `"Invalid schedulerFor defined: too many tasks have been scheduled"`
    );
  });

  it('should create a taskSelector with clones being reset to start', () => {
    // Arrange
    const instance = {} as SchedulerImplemMock.SchedulerImplem<unknown>;
    const SchedulerImplem = jest.spyOn(SchedulerImplemMock, 'SchedulerImplem');
    SchedulerImplem.mockImplementation(() => instance);
    const act = jest.fn();
    const requestedOrder = [4, 1, 2];
    const fakeLongScheduledTasks = [
      { taskId: 0 },
      { taskId: 1 },
      { taskId: 2 },
      { taskId: 3 },
      { taskId: 4 },
    ] as SchedulerImplemMock.ScheduledTask<unknown>[];

    // Act
    buildSchedulerFor(act, requestedOrder);
    const taskSelector = SchedulerImplem.mock.calls[0][1];

    // Assert
    expect(taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[0]);
    expect(taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[1]);
    const taskSelector2 = taskSelector.clone();
    expect(taskSelector2.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[0]);
    expect(taskSelector.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[2]);
    const taskSelector3 = taskSelector.clone();
    expect(taskSelector3.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[0]);
    expect(taskSelector3.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[1]);
    expect(taskSelector2.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[1]);
    expect(taskSelector2.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[2]);
    expect(taskSelector3.nextTaskIndex(fakeLongScheduledTasks)).toBe(requestedOrder[2]);
  });
});

describe('buildSchedulerFor (integration)', () => {
  it('should execute tasks in the requested order', async () => {
    // Arrange
    const act = jest.fn().mockImplementation((f) => f());
    const px = jest.fn();
    const py = jest.fn();
    const pz = jest.fn();

    // Act
    const s = buildSchedulerFor(act, [3, 1, 2]);
    s.schedule(Promise.resolve('px')).then(px);
    s.schedule(Promise.resolve('py')).then(py);
    s.schedule(Promise.resolve('pz')).then(pz);

    // Assert
    expect(px).not.toHaveBeenCalled();
    expect(py).not.toHaveBeenCalled();
    expect(pz).not.toHaveBeenCalled();

    await s.waitOne();
    expect(px).not.toHaveBeenCalled();
    expect(py).not.toHaveBeenCalled();
    expect(pz).toHaveBeenCalled();

    await s.waitOne();
    expect(px).toHaveBeenCalled();
    expect(py).not.toHaveBeenCalled();
    expect(pz).toHaveBeenCalled();

    await s.waitOne();
    expect(px).toHaveBeenCalled();
    expect(py).toHaveBeenCalled();
    expect(pz).toHaveBeenCalled();
  });
});
