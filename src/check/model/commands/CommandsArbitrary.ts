import { ArrayArbitrary } from '../../arbitrary/ArrayArbitrary';
import { Arbitrary } from '../../arbitrary/definition/Arbitrary';
import { Shrinkable } from '../../arbitrary/definition/Shrinkable';
import { oneof } from '../../arbitrary/OneOfArbitrary';
import { ICommand } from '../command/ICommand';
import { CommandWrapper } from './CommandWrapper';

/**
 * For arrays of {@link ICommand} to be executed by {@link modelRun} or {@link asyncModelRun}
 *
 * This implementation comes with a shrinker adapted for commands.
 * It should shrink more efficiently than {@link array} for {@link ICommand} arrays.
 *
 * @param commandArbs Arbitraries responsible to build commands
 * @param maxCommands Maximal number of commands to build
 */
export const commands = <Model extends object, Real, RunResult>(
  commandArbs: Arbitrary<ICommand<Model, Real, RunResult>>[],
  maxCommands?: number
): Arbitrary<ICommand<Model, Real, RunResult>[]> => {
  const internalCommandArb: Arbitrary<CommandWrapper<Model, Real, RunResult>> = oneof(...commandArbs).map(
    c => new CommandWrapper(c)
  );
  return new ArrayArbitrary(
    internalCommandArb,
    0,
    maxCommands != null ? maxCommands : 10,
    cs => cs.map(c => new Shrinkable(c.value.clone(), c.shrink)),
    cs => cs.filter(c => c.value.hasRan)
  );
};
