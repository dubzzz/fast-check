import { Random } from '../../../random/generator/Random';
import { Stream } from '../../../stream/Stream';
import { Arbitrary } from '../../arbitrary/definition/Arbitrary';
import { oneof } from '../../../arbitrary/oneof';
import { AsyncCommand } from '../command/AsyncCommand';
import { Command } from '../command/Command';
import { ICommand } from '../command/ICommand';
import { ReplayPath } from '../ReplayPath';
import { CommandsIterable } from './CommandsIterable';
import { CommandsContraints } from './CommandsContraints';
import { CommandWrapper } from './CommandWrapper';
import { makeLazy } from '../../../stream/LazyIterableIterator';
import { NextArbitrary } from '../../arbitrary/definition/NextArbitrary';
import { IntegerArbitrary } from '../../../arbitrary/_internals/IntegerArbitrary';
import { convertFromNext, convertToNext } from '../../arbitrary/definition/Converters';
import { NextValue } from '../../../fast-check-default';

// eslint-disable-next-line @typescript-eslint/ban-types
type CommandsArbitraryContext<Model extends object, Real, RunResult, CheckAsync extends boolean> = {
  shrunkOnce: boolean;
  items: NextValue<CommandWrapper<Model, Real, RunResult, CheckAsync>>[];
};

/** @internal */
// eslint-disable-next-line @typescript-eslint/ban-types
class CommandsArbitrary<Model extends object, Real, RunResult, CheckAsync extends boolean> extends NextArbitrary<
  CommandsIterable<Model, Real, RunResult, CheckAsync>
> {
  readonly oneCommandArb: NextArbitrary<CommandWrapper<Model, Real, RunResult, CheckAsync>>;
  readonly lengthArb: NextArbitrary<number>;
  private replayPath: boolean[];
  private replayPathPosition: number;
  constructor(
    commandArbs: Arbitrary<ICommand<Model, Real, RunResult, CheckAsync>>[],
    maxCommands: number,
    readonly sourceReplayPath: string | null,
    readonly disableReplayLog: boolean
  ) {
    super();
    this.oneCommandArb = convertToNext(oneof(...commandArbs).map((c) => new CommandWrapper(c)));
    this.lengthArb = new IntegerArbitrary(0, maxCommands);
    this.replayPath = []; // updated at first shrink
    this.replayPathPosition = 0;
  }

  private metadataForReplay() {
    return this.disableReplayLog ? '' : `replayPath=${JSON.stringify(ReplayPath.stringify(this.replayPath))}`;
  }

  private buildNextValueFor(
    items: NextValue<CommandWrapper<Model, Real, RunResult, CheckAsync>>[],
    shrunkOnce: boolean
  ) {
    return new NextValue(
      new CommandsIterable(
        items.map((item) => item.value_),
        () => this.metadataForReplay()
      ),
      { shrunkOnce, items }
    );
  }

  generate(mrng: Random): NextValue<CommandsIterable<Model, Real, RunResult, CheckAsync>> {
    // For the moment, we fully ignore the bias on commands...
    const size = this.lengthArb.generate(mrng, undefined);
    const sizeValue = size.value;
    const items: NextValue<CommandWrapper<Model, Real, RunResult, CheckAsync>>[] = Array(sizeValue);
    for (let idx = 0; idx !== sizeValue; ++idx) {
      // ...even when generating the commands themselves
      const item = this.oneCommandArb.generate(mrng, undefined);
      items[idx] = item;
    }
    this.replayPathPosition = 0; // reset replay
    return this.buildNextValueFor(items, false);
  }

  canShrinkWithoutContext(value: unknown): value is CommandsIterable<Model, Real, RunResult, CheckAsync> {
    // Not supported yet on commands
    return false;
  }

  /** Filter commands based on the real status of the execution */
  private filterOnExecution(itemsRaw: NextValue<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]) {
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
  private filterOnReplay(itemsRaw: NextValue<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]) {
    return itemsRaw.filter((c, idx) => {
      const state = this.replayPath[this.replayPathPosition + idx];
      if (state === undefined) throw new Error(`Too short replayPath`);
      if (!state && c.value_.hasRan) throw new Error(`Mismatch between replayPath and real execution`);
      return state;
    });
  }

  /** Filter commands for shrinking purposes */
  private filterForShrinkImpl(itemsRaw: NextValue<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]) {
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

  shrink(
    _value: CommandsIterable<Model, Real, RunResult, CheckAsync>,
    context: unknown
  ): Stream<NextValue<CommandsIterable<Model, Real, RunResult, CheckAsync>>> {
    if (context === undefined) {
      return Stream.nil<NextValue<CommandsIterable<Model, Real, RunResult, CheckAsync>>>();
    }
    const safeContext = context as CommandsArbitraryContext<Model, Real, RunResult, CheckAsync>;

    const shrunkOnce = safeContext.shrunkOnce;
    const itemsRaw = safeContext.items;

    const items = this.filterForShrinkImpl(itemsRaw); // filter out commands that have not been executed
    if (items.length === 0) {
      return Stream.nil<NextValue<CommandsIterable<Model, Real, RunResult, CheckAsync>>>();
    }

    // The shrinker of commands have to keep the last item
    // because it is the one causing the failure
    const rootShrink: Stream<NextValue<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]> = shrunkOnce
      ? Stream.nil()
      : new Stream([[]][Symbol.iterator]());

    // If the resulting shrinkable was simply built by joining the streams one by one,
    //  > stream[n] = stream[n-1].join(nextFor[n]) -- with nextFor[-1] = rootShrink
    // we would run into stack overflows when calling next to get back the 1st element (for huge n).
    // Indeed calling stream[n].next() would require to call stream[n-1].next() and so on...
    // Instead of that we define stream[n] = rootShrink.join(nextFor[0], ..., nextFor[n])
    // So that calling next on stream[n] will not have to run too many recursions
    const nextShrinks: IterableIterator<NextValue<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]>[] = [];

    // keep fixed number commands at the beginning
    // remove items in remaining part except the last one
    for (let numToKeep = 0; numToKeep !== items.length; ++numToKeep) {
      nextShrinks.push(
        makeLazy(() => {
          const fixedStart = items.slice(0, numToKeep);
          return this.lengthArb
            .shrink(items.length - 1 - numToKeep, undefined)
            .map((l) => fixedStart.concat(items.slice(items.length - (l.value + 1))));
        })
      );
    }

    // shrink one by one
    for (let itemAt = 0; itemAt !== items.length; ++itemAt) {
      nextShrinks.push(
        makeLazy(() =>
          this.oneCommandArb
            .shrink(items[itemAt].value_, items[itemAt].context)
            .map((v) => items.slice(0, itemAt).concat([v], items.slice(itemAt + 1)))
        )
      );
    }

    return rootShrink.join(...nextShrinks).map((shrinkables) => {
      return this.buildNextValueFor(
        shrinkables.map((c) => new NextValue(c.value_.clone(), c.context)),
        true
      );
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
