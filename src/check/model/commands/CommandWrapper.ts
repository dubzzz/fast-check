import { ICommand } from '../command/ICommand';

/** @hidden */
export class CommandWrapper<Model extends object, Real, RunResult, CheckAsync extends boolean>
  implements ICommand<Model, Real, RunResult, CheckAsync> {
  hasRan: boolean = false;
  constructor(readonly cmd: ICommand<Model, Real, RunResult, CheckAsync>) {}
  check(m: Readonly<Model>): CheckAsync extends false ? boolean : Promise<boolean> {
    return this.cmd.check(m);
  }
  run(m: Model, r: Real): RunResult {
    this.hasRan = true;
    return this.cmd.run(m, r);
  }
  clone(): CommandWrapper<Model, Real, RunResult, CheckAsync> {
    return new CommandWrapper<Model, Real, RunResult, CheckAsync>(this.cmd);
  }
  toString(): string {
    return this.cmd.toString();
  }
}
