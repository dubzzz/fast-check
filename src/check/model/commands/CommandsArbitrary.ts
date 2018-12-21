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

/** @hidden */
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
  private wrapper(
    items: Shrinkable<CommandWrapper<Model, Real, RunResult>>[],
    shrunkOnce: boolean
  ): Shrinkable<CommandsIterable<Model, Real, RunResult>> {
    return new Shrinkable(new CommandsIterable(items.map(s => s.value_)), () =>
      this.shrinkImpl(items, shrunkOnce).map(v => this.wrapper(v, true))
    );
  }
  generate(mrng: Random): Shrinkable<CommandsIterable<Model, Real, RunResult>> {
    const size = this.lengthArb.generate(mrng);
    const items: Shrinkable<CommandWrapper<Model, Real, RunResult>>[] = Array(size.value_);
    for (let idx = 0; idx !== size.value_; ++idx) {
      const item = this.oneCommandArb.generate(mrng);
      items[idx] = item;
    }
    return this.wrapper(items, false);
  }
  private shrinkImpl(
    itemsRaw: Shrinkable<CommandWrapper<Model, Real, RunResult>>[],
    shrunkOnce: boolean
  ): Stream<Shrinkable<CommandWrapper<Model, Real, RunResult>>[]> {
    const items = itemsRaw.filter(c => c.value_.hasRan); // filter out commands that have not been executed
    if (items.length === 0) {
      return Stream.nil<Shrinkable<CommandWrapper<Model, Real, RunResult>>[]>();
    }

    // The shrinker of commands have to keep the last item
    // because it is the one causing the failure
    const emptyOrNil = shrunkOnce
      ? Stream.nil<Shrinkable<CommandWrapper<Model, Real, RunResult>>[]>()
      : new Stream([[]][Symbol.iterator]());
    const size = this.lengthArb.shrinkableFor(items.length - 1, shrunkOnce);

    return emptyOrNil
      .join(size.shrink().map(l => items.slice(0, l.value).concat(items[items.length - 1]))) // try: remove items except the last one
      .join(this.shrinkImpl(items.slice(0, items.length - 1), false).map(vs => vs.concat(items[items.length - 1]))) // try: keep last, shrink remaining (rec)
      .join(items[items.length - 1].shrink().map(v => items.slice(0, -1).concat([v]))) // try: shrink last, keep others
      .map(shrinkables => {
        return shrinkables.map(c => {
          return new Shrinkable(c.value_.clone(), c.shrink);
        });
      });
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
