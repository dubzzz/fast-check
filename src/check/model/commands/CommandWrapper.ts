import { cloneMethod, hasCloneMethod } from '../../symbols';
import { ICommand } from '../command/ICommand';

/**
 * Wrapper around commands used internally by fast-check to wrap existing commands
 * in order to add them a flag to know whether or not they already have been executed
 */
export class CommandWrapper<Model extends object, Real, RunResult, CheckAsync extends boolean>
  implements ICommand<Model, Real, RunResult, CheckAsync> {
  hasRan = false;
  constructor(readonly cmd: ICommand<Model, Real, RunResult, CheckAsync>) {}
  check(m: Readonly<Model>): CheckAsync extends false ? boolean : Promise<boolean> {
    return this.cmd.check(m);
  }
  run(m: Model, r: Real): RunResult {
    this.hasRan = true;
    return this.cmd.run(m, r);
  }
  clone(): CommandWrapper<Model, Real, RunResult, CheckAsync> {
    if (hasCloneMethod(this.cmd))
      return new CommandWrapper<Model, Real, RunResult, CheckAsync>(this.cmd[cloneMethod]());
    return new CommandWrapper<Model, Real, RunResult, CheckAsync>(this.cmd);
  }
  toString(): string {
    return this.cmd.toString();
  }
}
