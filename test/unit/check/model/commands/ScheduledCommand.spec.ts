import { ScheduledCommand } from '../../../../../src/check/model/commands/ScheduledCommand';
import { AsyncCommand } from '../../../../../src/check/model/command/AsyncCommand';
import { Scheduler, SchedulerSequenceItem } from '../../../../../src/arbitrary/scheduler';

type Model = Record<string, unknown>;
type Real = unknown;

function buildFakeScheduler(): Scheduler {
  return {
    count: jest.fn(),
    waitOne: jest.fn(),
    waitAll: jest.fn(),
    schedule: jest.fn(),
    scheduleFunction: jest.fn(),
    scheduleSequence: (sequenceBuilders: SchedulerSequenceItem[]) => {
      const state = { done: false, faulty: false };
      const run = async () => {
        for (const b of sequenceBuilders) {
          const task = typeof b === 'function' ? b : b.builder;
          await task();
        }
      };
      return Object.assign(state, {
        task: run().then(
          () => {
            state.done = true;
            return state;
          },
          () => {
            state.faulty = true;
            return state;
          }
        ),
      });
    },
    report: jest.fn(),
  };
}

describe('ScheduledCommand', () => {
  it.each`
    checkValue
    ${true}
    ${false}
  `('Should properly forward the output of check ($checkValue)', async ({ checkValue }) => {
    // Arrange
    const cmd = new (class implements AsyncCommand<Model, Real> {
      check = (_m: Readonly<Model>) => checkValue;
      run = async (_m: Model, _r: Real) => {
        /* no-op */
      };
      toString = () => 'command';
    })();
    const scheduledCommand = new ScheduledCommand(buildFakeScheduler(), cmd);

    // Act
    const finalCheckValue = await scheduledCommand.check({});

    // Assert
    expect(finalCheckValue).toBe(checkValue);
  });

  it('Should properly forward exception raised during call to check', async () => {
    // Arrange
    const cmd = new (class implements AsyncCommand<Model, Real> {
      check = (_m: Readonly<Model>) => {
        throw new Error('Call to check failed');
      };
      run = async (_m: Model, _r: Real) => {
        /* no-op */
      };
      toString = () => 'command';
    })();
    const scheduledCommand = new ScheduledCommand(buildFakeScheduler(), cmd);

    // Act / Assert
    await expect(scheduledCommand.check({})).rejects.toMatchInlineSnapshot(`[Error: Call to check failed]`);
  });

  it('Should properly call to run', async () => {
    // Arrange
    const run = jest.fn();
    const model = {};
    const real = {};
    const cmd = new (class implements AsyncCommand<Model, Real> {
      check = (_m: Readonly<Model>) => true;
      run = run;
      toString = () => 'command';
    })();
    const scheduledCommand = new ScheduledCommand(buildFakeScheduler(), cmd);

    // Act
    await scheduledCommand.run(model, real);

    // Assert
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(model, real);
  });

  it('Should properly forward exception raised during call to run', async () => {
    // Arrange
    const cmd = new (class implements AsyncCommand<Model, Real> {
      check = (_m: Readonly<Model>) => true;
      run = async (_m: Model, _r: Real) => {
        throw new Error('Call to run failed');
      };
      toString = () => 'command';
    })();
    const scheduledCommand = new ScheduledCommand(buildFakeScheduler(), cmd);

    // Act / Assert
    await expect(scheduledCommand.run({}, {})).rejects.toMatchInlineSnapshot(`[Error: Call to run failed]`);
  });

  it('Should wrap calls to check and run using the scheduler', async () => {
    // Arrange
    const check = jest.fn();
    const run = jest.fn();
    const cmd = new (class implements AsyncCommand<Model, Real> {
      check = check;
      run = run;
      toString = () => 'command';
    })();
    const s = {
      ...buildFakeScheduler(),
      scheduleSequence: () => {
        return {
          done: false,
          faulty: false,
          task: Promise.resolve({ done: true, faulty: false }),
        };
      },
    };
    const scheduledCommand = new ScheduledCommand(s, cmd);

    // Act
    await scheduledCommand.check({});
    await scheduledCommand.run({}, {});

    // Assert
    expect(check).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });
});
