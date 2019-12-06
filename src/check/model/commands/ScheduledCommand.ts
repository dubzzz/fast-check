import { ICommand } from '../command/ICommand';
import { AsyncCommand } from '../command/AsyncCommand';
import { Scheduler } from '../../arbitrary/AsyncSchedulerArbitrary';
import { CommandsIterable } from './CommandsIterable';

/** @hidden */
export class ScheduledCommand<Model extends object, Real, RunResult, CheckAsync extends boolean>
  implements AsyncCommand<Model, Real, true> {
  constructor(readonly s: Scheduler, readonly cmd: ICommand<Model, Real, RunResult, CheckAsync>) {}

  async check(m: Readonly<Model>): Promise<boolean> {
    let checkPassed = false;
    const status = await this.s.scheduleSequence([
      {
        label: `check@${this.cmd.toString()}`,
        builder: async () => {
          checkPassed = await Promise.resolve(this.cmd.check(m));
        }
      }
    ]).task;

    if (status.faulty) {
      throw new Error(`Exception encountered during the execution of check`);
    }
    return checkPassed;
  }

  async run(m: Model, r: Real): Promise<void> {
    const status = await this.s.scheduleSequence([
      {
        label: `run@${this.cmd.toString()}`,
        builder: async () => {
          await this.cmd.run(m, r);
        }
      }
    ]).task;

    if (status.faulty) {
      throw new Error(`Exception encountered during the execution of run`);
    }
  }
}

/** @hidden */
export const scheduleCommands = function*<Model extends object, Real, CheckAsync extends boolean>(
  s: Scheduler,
  cmds: Iterable<AsyncCommand<Model, Real, CheckAsync>> | CommandsIterable<Model, Real, Promise<void>, CheckAsync>
): Iterable<AsyncCommand<Model, Real, true>> {
  for (const cmd of cmds) {
    yield new ScheduledCommand(s, cmd);
  }
};
