import { Random } from '../../../random/generator/Random';
import { Stream } from '../../../stream/Stream';
import { Arbitrary } from '../../arbitrary/definition/Arbitrary';
import { ArbitraryWithShrink } from '../../arbitrary/definition/ArbitraryWithShrink';
import { Shrinkable } from '../../arbitrary/definition/Shrinkable';
import { nat } from '../../arbitrary/IntegerArbitrary';
import { oneof } from '../../arbitrary/OneOfArbitrary';
import { ICommand } from '../command/ICommand';
import { CommandsIterable } from './CommandsIterable';
import { CommandWrapper } from './CommandWrapper';

class CommandsArbitrary<Model extends object, Real, RunResult> extends Arbitrary<
  CommandsIterable<Model, Real, RunResult>
> {
  readonly oneCommandArb: Arbitrary<CommandWrapper<Model, Real, RunResult>>;
  readonly lengthArb: ArbitraryWithShrink<number>;
  constructor(commandArbs: Arbitrary<ICommand<Model, Real, RunResult>>[], maxCommands: number) {
    super();
    this.oneCommandArb = oneof(...commandArbs).map(c => new CommandWrapper(c));
    this.lengthArb = nat(maxCommands);
  }
  private static cloneCommands<Model extends object, Real, RunResult>(
    cmds: Shrinkable<CommandWrapper<Model, Real, RunResult>>[]
  ) {
    return cmds.map(c => new Shrinkable(c.value.clone(), c.shrink));
  }
  private wrapper(
    items: Shrinkable<CommandWrapper<Model, Real, RunResult>>[],
    shrunkOnce: boolean
  ): Shrinkable<CommandsIterable<Model, Real, RunResult>> {
    return new Shrinkable(new CommandsIterable(items.map(s => s.value)), () =>
      this.shrinkImpl(items, shrunkOnce).map(v => this.wrapper(CommandsArbitrary.cloneCommands(v), true))
    );
  }
  generate(mrng: Random): Shrinkable<CommandsIterable<Model, Real, RunResult>> {
    const size = this.lengthArb.generate(mrng);
    const items: Shrinkable<CommandWrapper<Model, Real, RunResult>>[] = Array(size.value);
    for (let idx = 0; idx !== size.value; ++idx) {
      items[idx] = this.oneCommandArb.generate(mrng);
    }
    return this.wrapper(items, false);
  }
  private shrinkImpl(
    itemsRaw: Shrinkable<CommandWrapper<Model, Real, RunResult>>[],
    shrunkOnce: boolean
  ): Stream<Shrinkable<CommandWrapper<Model, Real, RunResult>>[]> {
    const items = itemsRaw.filter(c => c.value.hasRan); // filter out commands that have not been executed
    if (items.length === 0) {
      return Stream.nil<Shrinkable<CommandWrapper<Model, Real, RunResult>>[]>();
    }
    const size = this.lengthArb.shrinkableFor(items.length, shrunkOnce);
    return size
      .shrink()
      .map(l => items.slice(items.length - l.value)) // try: remove items at the beginning
      .join(this.shrinkImpl(items.slice(1), false).map(vs => [items[0]].concat(vs))) // try: keep first, shrink remaining
      .join(items[0].shrink().map(v => [v].concat(items.slice(1)))); // try: shrink first, keep others
  }
}

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
): Arbitrary<Iterable<ICommand<Model, Real, RunResult>>> => {
  return new CommandsArbitrary(commandArbs, maxCommands != null ? maxCommands : 10);
};
