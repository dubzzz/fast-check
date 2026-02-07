import { cloneMethod } from '../../symbols.js';
import type { WithCloneMethod } from '../../symbols.js';
import type { CommandWrapper } from './CommandWrapper.js';

/**
 * Iterable datastructure accepted as input for asyncModelRun and modelRun
 */
export class CommandsIterable<
  Model extends object,
  Real,
  RunResult,
  CheckAsync extends boolean = false,
> implements Iterable<CommandWrapper<Model, Real, RunResult, CheckAsync>> {
  constructor(
    readonly commands: CommandWrapper<Model, Real, RunResult, CheckAsync>[],
    readonly metadataForReplay: () => string,
  ) {
    (this as unknown as WithCloneMethod<unknown>)[cloneMethod] = function (
      this: CommandsIterable<Model, Real, RunResult, CheckAsync>,
    ): CommandsIterable<Model, Real, RunResult, CheckAsync> {
      return new CommandsIterable(
        this.commands.map((c) => c.clone()),
        this.metadataForReplay,
      );
    };
  }
  [Symbol.iterator](): Iterator<CommandWrapper<Model, Real, RunResult, CheckAsync>> {
    return this.commands[Symbol.iterator]();
  }
  toString(): string {
    const serializedCommands = this.commands
      .filter((c) => c.hasRan)
      .map((c) => c.toString())
      .join(',');
    const metadata = this.metadataForReplay();
    return metadata.length !== 0 ? `${serializedCommands} /*${metadata}*/` : serializedCommands;
  }
}
