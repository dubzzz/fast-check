import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import type { AsyncCommand } from '../check/model/command/AsyncCommand.js';
import type { Command } from '../check/model/command/Command.js';
import type { ICommand } from '../check/model/command/ICommand.js';
import type { CommandsContraints } from '../check/model/commands/CommandsContraints.js';
import { CommandsArbitrary } from './_internals/CommandsArbitrary.js';
import {
  maxGeneratedLengthFromSizeForArbitrary,
  MaxLengthUpperBound,
} from './_internals/helpers/MaxLengthFromMinLength.js';

/**
 * For arrays of {@link AsyncCommand} to be executed by {@link asyncModelRun}
 *
 * This implementation comes with a shrinker adapted for commands.
 * It should shrink more efficiently than {@link array} for {@link AsyncCommand} arrays.
 *
 * @param commandArbs - Arbitraries responsible to build commands
 * @param constraints - Constraints to be applied when generating the commands (since 1.11.0)
 *
 * @remarks Since 1.5.0
 * @public
 */
function commands<Model extends object, Real, CheckAsync extends boolean>(
  commandArbs: Arbitrary<AsyncCommand<Model, Real, CheckAsync>>[],
  constraints?: CommandsContraints,
): Arbitrary<Iterable<AsyncCommand<Model, Real, CheckAsync>>>;
/**
 * For arrays of {@link Command} to be executed by {@link modelRun}
 *
 * This implementation comes with a shrinker adapted for commands.
 * It should shrink more efficiently than {@link array} for {@link Command} arrays.
 *
 * @param commandArbs - Arbitraries responsible to build commands
 * @param constraints - Constraints to be applied when generating the commands (since 1.11.0)
 *
 * @remarks Since 1.5.0
 * @public
 */
function commands<Model extends object, Real>(
  commandArbs: Arbitrary<Command<Model, Real>>[],
  constraints?: CommandsContraints,
): Arbitrary<Iterable<Command<Model, Real>>>;
function commands<Model extends object, Real, RunResult, CheckAsync extends boolean>(
  commandArbs: Arbitrary<ICommand<Model, Real, RunResult, CheckAsync>>[],
  constraints: CommandsContraints = {},
): Arbitrary<Iterable<ICommand<Model, Real, RunResult, CheckAsync>>> {
  const { size, maxCommands = MaxLengthUpperBound, disableReplayLog = false, replayPath = null } = constraints;
  const specifiedMaxCommands = constraints.maxCommands !== undefined;
  const maxGeneratedCommands = maxGeneratedLengthFromSizeForArbitrary(size, 0, maxCommands, specifiedMaxCommands);
  return new CommandsArbitrary(commandArbs, maxGeneratedCommands, maxCommands, replayPath, disableReplayLog);
}
export { commands };
