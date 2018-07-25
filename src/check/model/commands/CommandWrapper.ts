import { ICommand } from '../command/ICommand';

/** @hidden */
export class CommandWrapper<Model extends object, Real, RunResult> implements ICommand<Model, Real, RunResult> {
  hasRan: boolean = false;
  constructor(readonly cmd: ICommand<Model, Real, RunResult>) {}
  check(m: Readonly<Model>): boolean {
    return this.cmd.check(m);
  }
  run(m: Model, r: Real): RunResult {
    this.hasRan = true;
    return this.cmd.run(m, r);
  }
  clone(): CommandWrapper<Model, Real, RunResult> {
    return new CommandWrapper<Model, Real, RunResult>(this.cmd);
  }
  toString(): string {
    return this.hasRan ? this.cmd.toString() : '-';
  }
}
