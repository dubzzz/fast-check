import { Random } from '../../../random/generator/Random';
import { Stream } from '../../../stream/Stream';
import { Arbitrary } from '../../arbitrary/definition/Arbitrary';
import { ArbitraryWithShrink } from '../../arbitrary/definition/ArbitraryWithShrink';
import { Shrinkable } from '../../arbitrary/definition/Shrinkable';
import { nat } from '../../arbitrary/IntegerArbitrary';
import { oneof } from '../../arbitrary/OneOfArbitrary';
import { AsyncCommand } from '../command/AsyncCommand';
import { Command } from '../command/Command';
import { ICommand } from '../command/ICommand';
import { CommandsIterable } from './CommandsIterable';
import { CommandWrapper } from './CommandWrapper';

/** @hidden */
class CommandsArbitrary<Model extends object, Real, RunResult, CheckAsync extends boolean> extends Arbitrary<
  CommandsIterable<Model, Real, RunResult, CheckAsync>
> {
  readonly oneCommandArb: Arbitrary<CommandWrapper<Model, Real, RunResult, CheckAsync>>;
  readonly lengthArb: ArbitraryWithShrink<number>;
  constructor(commandArbs: Arbitrary<ICommand<Model, Real, RunResult, CheckAsync>>[], maxCommands: number) {
    super();
    this.oneCommandArb = oneof(...commandArbs).map(c => new CommandWrapper(c));
    this.lengthArb = nat(maxCommands);
  }
  private wrapper(
    items: Shrinkable<CommandWrapper<Model, Real, RunResult, CheckAsync>>[],
    shrunkOnce: boolean
  ): Shrinkable<CommandsIterable<Model, Real, RunResult, CheckAsync>> {
    return new Shrinkable(new CommandsIterable(items.map(s => s.value_)), () =>
      this.shrinkImpl(items, shrunkOnce).map(v => this.wrapper(v, true))
    );
  }
  generate(mrng: Random): Shrinkable<CommandsIterable<Model, Real, RunResult, CheckAsync>> {
    const size = this.lengthArb.generate(mrng);
    const items: Shrinkable<CommandWrapper<Model, Real, RunResult, CheckAsync>>[] = Array(size.value_);
    for (let idx = 0; idx !== size.value_; ++idx) {
      const item = this.oneCommandArb.generate(mrng);
      items[idx] = item;
    }
    return this.wrapper(items, false);
  }
  private shrinkImpl(
    itemsRaw: Shrinkable<CommandWrapper<Model, Real, RunResult, CheckAsync>>[],
    shrunkOnce: boolean
  ): Stream<Shrinkable<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]> {
    const items = itemsRaw.filter(c => c.value_.hasRan); // filter out commands that have not been executed
    if (items.length === 0) {
      return Stream.nil<Shrinkable<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]>();
    }

    // The shrinker of commands have to keep the last item
    // because it is the one causing the failure
    let allShrinks = shrunkOnce
      ? Stream.nil<Shrinkable<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]>()
      : new Stream([[]][Symbol.iterator]());

    // keep fixed number commands at the beginnign
    // remove items in remaining part except the last one
    for (let numToKeep = 0; numToKeep !== items.length; ++numToKeep) {
      const size = this.lengthArb.shrinkableFor(items.length - 1 - numToKeep, false);
      const fixedStart = items.slice(0, numToKeep);
      allShrinks = allShrinks.join(
        size.shrink().map(l => fixedStart.concat(items.slice(items.length - (l.value + 1))))
      );
    }

    // shrink one by one
    for (let itemAt = 0; itemAt !== items.length; ++itemAt) {
      allShrinks = allShrinks.join(
        items[itemAt].shrink().map(v => items.slice(0, itemAt).concat([v], items.slice(itemAt + 1)))
      );
    }

    return allShrinks.map(shrinkables => {
      return shrinkables.map(c => {
        return new Shrinkable(c.value_.clone(), c.shrink);
      });
    });
  }
}

/**
 * For arrays of {@link AsyncCommand} to be executed by {@link asyncModelRun}
 *
 * This implementation comes with a shrinker adapted for commands.
 * It should shrink more efficiently than {@link array} for {@link AsyncCommand} arrays.
 *
 * @param commandArbs Arbitraries responsible to build commands
 * @param maxCommands Maximal number of commands to build
 */
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
 * @param commandArbs Arbitraries responsible to build commands
 * @param maxCommands Maximal number of commands to build
 */
function commands<Model extends object, Real>(
  commandArbs: Arbitrary<Command<Model, Real>>[],
  maxCommands?: number
): Arbitrary<Iterable<Command<Model, Real>>>;
function commands<Model extends object, Real, RunResult, CheckAsync extends boolean>(
  commandArbs: Arbitrary<ICommand<Model, Real, RunResult, CheckAsync>>[],
  maxCommands?: number
): Arbitrary<Iterable<ICommand<Model, Real, RunResult, CheckAsync>>> {
  return new CommandsArbitrary(commandArbs, maxCommands != null ? maxCommands : 10);
}

export { commands };
