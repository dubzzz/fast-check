import { cloneMethod } from '../../symbols';
import { CommandWrapper } from './CommandWrapper';

/** @hidden */
export class CommandsIterable<Model extends object, Real, RunResult, CheckAsync extends boolean = false>
  implements Iterable<CommandWrapper<Model, Real, RunResult, CheckAsync>> {
  constructor(readonly commands: CommandWrapper<Model, Real, RunResult, CheckAsync>[]) {}
  [Symbol.iterator](): Iterator<CommandWrapper<Model, Real, RunResult, CheckAsync>> {
    return this.commands[Symbol.iterator]();
  }
  [cloneMethod]() {
    return new CommandsIterable(this.commands.map(c => c.clone()));
  }
  toString(): string {
    return this.commands
      .filter(c => c.hasRan)
      .map(c => c.toString())
      .join(',');
  }
}
