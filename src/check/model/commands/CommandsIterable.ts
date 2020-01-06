import { cloneMethod } from '../../symbols';
import { CommandWrapper } from './CommandWrapper';

/**
 * Iterable datastructure accepted as input for asyncModelRun and modelRun
 */
export class CommandsIterable<Model extends object, Real, RunResult, CheckAsync extends boolean = false>
  implements Iterable<CommandWrapper<Model, Real, RunResult, CheckAsync>> {
  constructor(
    readonly commands: CommandWrapper<Model, Real, RunResult, CheckAsync>[],
    readonly metadataForReplay: () => string
  ) {}
  [Symbol.iterator](): Iterator<CommandWrapper<Model, Real, RunResult, CheckAsync>> {
    return this.commands[Symbol.iterator]();
  }
  [cloneMethod]() {
    return new CommandsIterable(this.commands.map(c => c.clone()), this.metadataForReplay);
  }
  toString(): string {
    const serializedCommands = this.commands
      .filter(c => c.hasRan)
      .map(c => c.toString())
      .join(',');
    const metadata = this.metadataForReplay();
    return metadata.length !== 0 ? `${serializedCommands} /*${metadata}*/` : serializedCommands;
  }
}
