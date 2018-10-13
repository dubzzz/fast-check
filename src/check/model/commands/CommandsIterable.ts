import { CommandWrapper } from './CommandWrapper';

/** @hidden */
export class CommandsIterable<Model extends object, Real, RunResult>
  implements Iterable<CommandWrapper<Model, Real, RunResult>> {
  private lastErrorDetectedStr: string = '';
  constructor(readonly commands: CommandWrapper<Model, Real, RunResult>[]) {}
  [Symbol.iterator](): Iterator<CommandWrapper<Model, Real, RunResult>> {
    for (let idx = 0; idx !== this.commands.length; ++idx) {
      this.commands[idx].hasRan = false;
    }
    return this.commands[Symbol.iterator]();
  }
  errorDetected() {
    this.lastErrorDetectedStr = this.commands
      .filter(c => c.hasRan)
      .map(c => c.toString())
      .join(',');
  }
  toString(): string {
    return this.lastErrorDetectedStr;
  }
}
