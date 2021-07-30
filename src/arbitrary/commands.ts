import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext } from '../check/arbitrary/definition/Converters';
import { AsyncCommand } from '../check/model/command/AsyncCommand';
import { Command } from '../check/model/command/Command';
import { ICommand } from '../check/model/command/ICommand';
import { CommandsContraints } from '../check/model/commands/CommandsContraints';
import { CommandsArbitrary } from './_internals/CommandsArbitrary';

/**
 * For arrays of {@link AsyncCommand} to be executed by {@link asyncModelRun}
 *
 * This implementation comes with a shrinker adapted for commands.
 * It should shrink more efficiently than {@link array} for {@link AsyncCommand} arrays.
 *
 * @param commandArbs - Arbitraries responsible to build commands
 * @param maxCommands - Maximal number of commands to build
 *
 * @deprecated
 * Superceded by `fc.commands(commandArbs, {maxCommands})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 1.5.0
 * @public
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function commands<Model extends object, Real, CheckAsync extends boolean>(
  commandArbs: Arbitrary<AsyncCommand<Model, Real, CheckAsync>>[],
  maxCommands?: number
): Arbitrary<Iterable<AsyncCommand<Model, Real, CheckAsync>>>;
/**
 * For arrays of {@link Command} to be executed by {@link modelRun}
 *
 * This implementation comes with a shrinker adapted for commands.
 * It should shrink more efficiently than {@link array} for {@link Command} arrays.
 *
 * @param commandArbs - Arbitraries responsible to build commands
 * @param maxCommands - Maximal number of commands to build
 *
 * @deprecated
 * Superceded by `fc.commands(commandArbs, {maxCommands})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 1.5.0
 * @public
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function commands<Model extends object, Real>(
  commandArbs: Arbitrary<Command<Model, Real>>[],
  maxCommands?: number
): Arbitrary<Iterable<Command<Model, Real>>>;
/**
 * For arrays of {@link AsyncCommand} to be executed by {@link asyncModelRun}
 *
 * This implementation comes with a shrinker adapted for commands.
 * It should shrink more efficiently than {@link array} for {@link AsyncCommand} arrays.
 *
 * @param commandArbs - Arbitraries responsible to build commands
 * @param constraints - Contraints to be applied when generating the commands
 *
 * @remarks Since 1.11.0
 * @public
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function commands<Model extends object, Real, CheckAsync extends boolean>(
  commandArbs: Arbitrary<AsyncCommand<Model, Real, CheckAsync>>[],
  constraints?: CommandsContraints
): Arbitrary<Iterable<AsyncCommand<Model, Real, CheckAsync>>>;
/**
 * For arrays of {@link Command} to be executed by {@link modelRun}
 *
 * This implementation comes with a shrinker adapted for commands.
 * It should shrink more efficiently than {@link array} for {@link Command} arrays.
 *
 * @param commandArbs - Arbitraries responsible to build commands
 * @param constraints - Constraints to be applied when generating the commands
 *
 * @remarks Since 1.11.0
 * @public
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function commands<Model extends object, Real>(
  commandArbs: Arbitrary<Command<Model, Real>>[],
  constraints?: CommandsContraints
): Arbitrary<Iterable<Command<Model, Real>>>;
// eslint-disable-next-line @typescript-eslint/ban-types
function commands<Model extends object, Real, RunResult, CheckAsync extends boolean>(
  commandArbs: Arbitrary<ICommand<Model, Real, RunResult, CheckAsync>>[],
  constraints?: number | CommandsContraints
): Arbitrary<Iterable<ICommand<Model, Real, RunResult, CheckAsync>>> {
  const config =
    constraints == null ? {} : typeof constraints === 'number' ? { maxCommands: constraints } : constraints;
  return convertFromNext(
    new CommandsArbitrary(
      commandArbs,
      config.maxCommands != null ? config.maxCommands : 10,
      config.replayPath != null ? config.replayPath : null,
      !!config.disableReplayLog
    )
  );
}
export { commands };
