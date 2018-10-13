import { CommandWrapper } from './CommandWrapper';

export class CommandsIterable<Model extends object, Real, RunResult>
  implements Iterable<CommandWrapper<Model, Real, RunResult>> {
  constructor(readonly commands: CommandWrapper<Model, Real, RunResult>[]) {}
  [Symbol.iterator](): Iterator<CommandWrapper<Model, Real, RunResult>> {
    return this.commands[Symbol.iterator]();
  }
  toString(): string {
    return this.commands
      .filter(c => c.hasRan)
      .map(c => c.toString())
      .join(',');
  }
}
