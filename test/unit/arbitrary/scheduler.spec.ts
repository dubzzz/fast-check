import { scheduler, Scheduler, schedulerFor } from '../../../src/arbitrary/scheduler';
import { fakeNextArbitrary } from './__test-helpers__/NextArbitraryHelpers';

import * as BuildSchedulerForMock from '../../../src/arbitrary/_internals/helpers/BuildSchedulerFor';
import * as SchedulerArbitraryMock from '../../../src/arbitrary/_internals/SchedulerArbitrary';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
}
beforeEach(beforeEachHook);

describe('scheduler', () => {
  it('should instantiate a SchedulerArbitrary with defaulted act (if not provided)', () => {
    // Arrange
    const { instance } = fakeNextArbitrary<Scheduler<unknown>>();
    const SchedulerArbitrary = jest.spyOn(SchedulerArbitraryMock, 'SchedulerArbitrary');
    SchedulerArbitrary.mockReturnValue(instance as SchedulerArbitraryMock.SchedulerArbitrary<unknown>);

    // Act
    const s = scheduler();

    // Assert
    expect(s).toBe(instance);
    expect(SchedulerArbitrary).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should pass a defaulted act that calls the received function', () => {
    // Arrange
    const { instance } = fakeNextArbitrary<Scheduler<unknown>>();
    const SchedulerArbitrary = jest.spyOn(SchedulerArbitraryMock, 'SchedulerArbitrary');
    SchedulerArbitrary.mockReturnValue(instance as SchedulerArbitraryMock.SchedulerArbitrary<unknown>);
    const outF = new Promise<unknown>(() => {});
    const f = jest.fn().mockReturnValue(outF);

    // Act
    scheduler();
    const receivedAct = SchedulerArbitrary.mock.calls[0][0];
    const out = receivedAct(f);

    // Assert
    expect(f).toHaveBeenCalledTimes(1);
    expect(out).toBe(outF);
  });
  it('should instantiate a SchedulerArbitrary with received act', () => {
    // Arrange
    const { instance } = fakeNextArbitrary<Scheduler<unknown>>();
    const SchedulerArbitrary = jest.spyOn(SchedulerArbitraryMock, 'SchedulerArbitrary');
    SchedulerArbitrary.mockReturnValue(instance as SchedulerArbitraryMock.SchedulerArbitrary<unknown>);
    const act = () => Promise.resolve();

    // Act
    const s = scheduler({ act });

    // Assert
    expect(s).toBe(instance);
    expect(SchedulerArbitrary).toHaveBeenCalledWith(act);
  });
});

describe('schedulerFor', () => {
  it('should build proper scheduler when using template string from error logs', async () => {
    // Arrange
    const instance = {} as Scheduler<unknown>;
    const buildSchedulerFor = jest.spyOn(BuildSchedulerForMock, 'buildSchedulerFor');
    buildSchedulerFor.mockReturnValue(instance);

    // Act
    const s = schedulerFor()`
      -> [task${3}] promise rejected with value "pz"
      -> [task${1}] promise resolved with value "px"
      -> [task${2}] promise rejected with value "py"`;

    // Assert
    expect(s).toBe(instance);
    expect(buildSchedulerFor).toHaveBeenCalledWith(expect.any(Function), [3, 1, 2]);
  });

  it('should build proper scheduler when using custom template string', async () => {
    // Arrange
    const instance = {} as Scheduler<unknown>;
    const buildSchedulerFor = jest.spyOn(BuildSchedulerForMock, 'buildSchedulerFor');
    buildSchedulerFor.mockReturnValue(instance);

    // Act
    const s = schedulerFor()`
        This scheduler will resolve task ${2} first
        followed by ${3} and only then task ${1}`;

    // Assert
    expect(s).toBe(instance);
    expect(buildSchedulerFor).toHaveBeenCalledWith(expect.any(Function), [2, 3, 1]);
  });

  it('should build proper scheduler when using ordering array', async () => {
    // Arrange
    const instance = {} as Scheduler<unknown>;
    const buildSchedulerFor = jest.spyOn(BuildSchedulerForMock, 'buildSchedulerFor');
    buildSchedulerFor.mockReturnValue(instance);

    // Act
    const s = schedulerFor([2, 3, 1]);

    // Assert
    expect(s).toBe(instance);
    expect(buildSchedulerFor).toHaveBeenCalledWith(expect.any(Function), [2, 3, 1]);
  });
});
