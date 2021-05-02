import { ICommand } from '../command/ICommand';
import { AsyncCommand } from '../command/AsyncCommand';
import { Scheduler } from '../../../arbitrary/scheduler';

/** @internal */
// eslint-disable-next-line @typescript-eslint/ban-types
export class ScheduledCommand<Model extends object, Real, RunResult, CheckAsync extends boolean>
  implements AsyncCommand<Model, Real, true> {
  constructor(readonly s: Scheduler, readonly cmd: ICommand<Model, Real, RunResult, CheckAsync>) {}

  async check(m: Readonly<Model>): Promise<boolean> {
    let error: unknown = null;
    let checkPassed = false;
    const status = await this.s.scheduleSequence([
      {
        label: `check@${this.cmd.toString()}`,
        builder: async () => {
          try {
            checkPassed = await Promise.resolve(this.cmd.check(m));
          } catch (err) {
            error = err;
            throw err;
          }
        },
      },
    ]).task;

    if (status.faulty) {
      throw error;
    }
    return checkPassed;
  }

  async run(m: Model, r: Real): Promise<void> {
    let error: unknown = null;
    const status = await this.s.scheduleSequence([
      {
        label: `run@${this.cmd.toString()}`,
        builder: async () => {
          try {
            await this.cmd.run(m, r);
          } catch (err) {
            error = err;
            throw err;
          }
        },
      },
    ]).task;

    if (status.faulty) {
      throw error;
    }
  }
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/ban-types
export const scheduleCommands = function* <Model extends object, Real, CheckAsync extends boolean>(
  s: Scheduler,
  cmds: Iterable<AsyncCommand<Model, Real, CheckAsync>>
): Iterable<AsyncCommand<Model, Real, true>> {
  for (const cmd of cmds) {
    yield new ScheduledCommand(s, cmd);
  }
};
