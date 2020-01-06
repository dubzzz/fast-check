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
import { ReplayPath } from '../ReplayPath';
import { CommandsIterable } from './CommandsIterable';
import { CommandsSettings } from './CommandsSettings';
import { CommandWrapper } from './CommandWrapper';

/** @internal */
class CommandsArbitrary<Model extends object, Real, RunResult, CheckAsync extends boolean> extends Arbitrary<
  CommandsIterable<Model, Real, RunResult, CheckAsync>
> {
  readonly oneCommandArb: Arbitrary<CommandWrapper<Model, Real, RunResult, CheckAsync>>;
  readonly lengthArb: ArbitraryWithShrink<number>;
  private replayPath: boolean[];
  private replayPathPosition: number;
  constructor(
    commandArbs: Arbitrary<ICommand<Model, Real, RunResult, CheckAsync>>[],
    maxCommands: number,
    readonly sourceReplayPath: string | null,
    readonly disableReplayLog: boolean
  ) {
    super();
    this.oneCommandArb = oneof(...commandArbs).map(c => new CommandWrapper(c));
    this.lengthArb = nat(maxCommands);
    this.replayPath = []; // updated at first shrink
    this.replayPathPosition = 0;
  }
  private metadataForReplay() {
    return this.disableReplayLog ? '' : `replayPath=${JSON.stringify(ReplayPath.stringify(this.replayPath))}`;
  }
  private wrapper(
    items: Shrinkable<CommandWrapper<Model, Real, RunResult, CheckAsync>>[],
    shrunkOnce: boolean
  ): Shrinkable<CommandsIterable<Model, Real, RunResult, CheckAsync>> {
    return new Shrinkable(new CommandsIterable(items.map(s => s.value_), () => this.metadataForReplay()), () =>
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
    this.replayPathPosition = 0; // reset replay
    return this.wrapper(items, false);
  }
  /** Filter commands based on the real status of the execution */
  private filterOnExecution(itemsRaw: Shrinkable<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]) {
    const items: typeof itemsRaw = [];
    for (const c of itemsRaw) {
      if (c.value_.hasRan) {
        this.replayPath.push(true);
        items.push(c);
      } else this.replayPath.push(false);
    }
    return items;
  }
  /** Filter commands based on the internal replay state */
  private filterOnReplay(itemsRaw: Shrinkable<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]) {
    return itemsRaw.filter((c, idx) => {
      const state = this.replayPath[this.replayPathPosition + idx];
      if (state === undefined) throw new Error(`Too short replayPath`);
      if (!state && c.value_.hasRan) throw new Error(`Mismatch between replayPath and real execution`);
      return state;
    });
  }
  /** Filter commands for shrinking purposes */
  private filterForShrinkImpl(itemsRaw: Shrinkable<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]) {
    if (this.replayPathPosition === 0) {
      this.replayPath = this.sourceReplayPath !== null ? ReplayPath.parse(this.sourceReplayPath) : [];
    }
    const items =
      this.replayPathPosition < this.replayPath.length
        ? this.filterOnReplay(itemsRaw)
        : this.filterOnExecution(itemsRaw);
    this.replayPathPosition += itemsRaw.length;
    return items;
  }
  private shrinkImpl(
    itemsRaw: Shrinkable<CommandWrapper<Model, Real, RunResult, CheckAsync>>[],
    shrunkOnce: boolean
  ): Stream<Shrinkable<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]> {
    const items = this.filterForShrinkImpl(itemsRaw); // filter out commands that have not been executed
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
  settings?: CommandsSettings
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
  settings?: CommandsSettings
): Arbitrary<Iterable<Command<Model, Real>>>;
function commands<Model extends object, Real, RunResult, CheckAsync extends boolean>(
  commandArbs: Arbitrary<ICommand<Model, Real, RunResult, CheckAsync>>[],
  settings?: number | CommandsSettings
): Arbitrary<Iterable<ICommand<Model, Real, RunResult, CheckAsync>>> {
  const config = settings == null ? {} : typeof settings === 'number' ? { maxCommands: settings } : settings;
  return new CommandsArbitrary(
    commandArbs,
    config.maxCommands != null ? config.maxCommands : 10,
    config.replayPath != null ? config.replayPath : null,
    !!config.disableReplayLog
  );
}

export { commands };
