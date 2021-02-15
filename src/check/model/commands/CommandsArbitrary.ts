import { Random } from '../../../random/generator/Random';
import { Stream } from '../../../stream/Stream';
import { Arbitrary } from '../../arbitrary/definition/Arbitrary';
import { ArbitraryWithContextualShrink } from '../../arbitrary/definition/ArbitraryWithContextualShrink';
import { Shrinkable } from '../../arbitrary/definition/Shrinkable';
import { nat } from '../../arbitrary/IntegerArbitrary';
import { oneof } from '../../arbitrary/OneOfArbitrary';
import { AsyncCommand } from '../command/AsyncCommand';
import { Command } from '../command/Command';
import { ICommand } from '../command/ICommand';
import { ReplayPath } from '../ReplayPath';
import { CommandsIterable } from './CommandsIterable';
import { CommandsContraints } from './CommandsContraints';
import { CommandWrapper } from './CommandWrapper';
import { makeLazy } from '../../../stream/LazyIterableIterator';

/** @internal */
// eslint-disable-next-line @typescript-eslint/ban-types
class CommandsArbitrary<Model extends object, Real, RunResult, CheckAsync extends boolean> extends Arbitrary<
  CommandsIterable<Model, Real, RunResult, CheckAsync>
> {
  readonly oneCommandArb: Arbitrary<CommandWrapper<Model, Real, RunResult, CheckAsync>>;
  readonly lengthArb: ArbitraryWithContextualShrink<number>;
  private replayPath: boolean[];
  private replayPathPosition: number;
  constructor(
    commandArbs: Arbitrary<ICommand<Model, Real, RunResult, CheckAsync>>[],
    maxCommands: number,
    readonly sourceReplayPath: string | null,
    readonly disableReplayLog: boolean
  ) {
    super();
    this.oneCommandArb = oneof(...commandArbs).map((c) => new CommandWrapper(c));
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
    return new Shrinkable(
      new CommandsIterable(
        items.map((s) => s.value_),
        () => this.metadataForReplay()
      ),
      () => this.shrinkImpl(items, shrunkOnce).map((v) => this.wrapper(v, true))
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
    const rootShrink = shrunkOnce
      ? Stream.nil<Shrinkable<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]>()
      : new Stream([[]][Symbol.iterator]());

    // If the resulting shrinkable was simply built by joining the streams one by one,
    //  > stream[n] = stream[n-1].join(nextFor[n]) -- with nextFor[-1] = rootShrink
    // we would run into stack overflows when calling next to get back the 1st element (for huge n).
    // Indeed calling stream[n].next() would require to call stream[n-1].next() and so on...
    // Instead of that we define stream[n] = rootShrink.join(nextFor[0], ..., nextFor[n])
    // So that calling next on stream[n] will not have to run too many recursions
    const nextShrinks: IterableIterator<Shrinkable<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]>[] = [];

    // keep fixed number commands at the beginning
    // remove items in remaining part except the last one
    for (let numToKeep = 0; numToKeep !== items.length; ++numToKeep) {
      nextShrinks.push(
        makeLazy(() => {
          const size = this.lengthArb.contextualShrinkableFor(items.length - 1 - numToKeep);
          const fixedStart = items.slice(0, numToKeep);
          return size.shrink().map((l) => fixedStart.concat(items.slice(items.length - (l.value + 1))));
        })
      );
    }

    // shrink one by one
    for (let itemAt = 0; itemAt !== items.length; ++itemAt) {
      nextShrinks.push(
        makeLazy(() => items[itemAt].shrink().map((v) => items.slice(0, itemAt).concat([v], items.slice(itemAt + 1))))
      );
    }

    return rootShrink.join(...nextShrinks).map((shrinkables) => {
      return shrinkables.map((c) => {
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
 * @param commandArbs - Arbitraries responsible to build commands
 * @param constraints - Contraints to be applied when generating the commands (since 1.11.0)
 *
 * @remarks Since 1.5.0
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
 * @param constraints - Constraints to be applied when generating the commands (since 1.11.0
 *
 * @remarks Since 1.5.0
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
  constraints: CommandsContraints = {}
): Arbitrary<Iterable<ICommand<Model, Real, RunResult, CheckAsync>>> {
  const { maxCommands = 10, replayPath = null, disableReplayLog = false } = constraints;
  return new CommandsArbitrary(commandArbs, maxCommands, replayPath, disableReplayLog);
}

export { commands };
