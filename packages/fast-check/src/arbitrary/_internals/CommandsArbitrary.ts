import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { ICommand } from '../../check/model/command/ICommand';
import { CommandsIterable } from '../../check/model/commands/CommandsIterable';
import { CommandWrapper } from '../../check/model/commands/CommandWrapper';
import { ReplayPath } from '../../check/model/ReplayPath';
import { Random } from '../../random/generator/Random';
import { makeLazy } from '../../stream/LazyIterableIterator';
import { Stream } from '../../stream/Stream';
import { oneof } from '../oneof';
import { restrictedIntegerArbitraryBuilder } from './builders/RestrictedIntegerArbitraryBuilder';

// eslint-disable-next-line @typescript-eslint/ban-types
type CommandsArbitraryContext<Model extends object, Real, RunResult, CheckAsync extends boolean> = {
  shrunkOnce: boolean;
  items: Value<CommandWrapper<Model, Real, RunResult, CheckAsync>>[];
};

/** @internal */
// eslint-disable-next-line @typescript-eslint/ban-types
export class CommandsArbitrary<Model extends object, Real, RunResult, CheckAsync extends boolean> extends Arbitrary<
  CommandsIterable<Model, Real, RunResult, CheckAsync>
> {
  readonly oneCommandArb: Arbitrary<CommandWrapper<Model, Real, RunResult, CheckAsync>>;
  readonly lengthArb: Arbitrary<number>;
  private replayPath: boolean[];
  private replayPathPosition: number;
  constructor(
    commandArbs: Arbitrary<ICommand<Model, Real, RunResult, CheckAsync>>[],
    maxGeneratedCommands: number,
    maxCommands: number,
    readonly sourceReplayPath: string | null,
    readonly disableReplayLog: boolean
  ) {
    super();
    this.oneCommandArb = oneof(...commandArbs).map((c) => new CommandWrapper(c));
    this.lengthArb = restrictedIntegerArbitraryBuilder(0, maxGeneratedCommands, maxCommands);
    this.replayPath = []; // updated at first shrink
    this.replayPathPosition = 0;
  }

  private metadataForReplay() {
    return this.disableReplayLog ? '' : `replayPath=${JSON.stringify(ReplayPath.stringify(this.replayPath))}`;
  }

  private buildValueFor(items: Value<CommandWrapper<Model, Real, RunResult, CheckAsync>>[], shrunkOnce: boolean) {
    const commands = items.map((item) => item.value_);
    const context: CommandsArbitraryContext<Model, Real, RunResult, CheckAsync> = { shrunkOnce, items };
    return new Value(new CommandsIterable(commands, () => this.metadataForReplay()), context);
  }

  generate(mrng: Random): Value<CommandsIterable<Model, Real, RunResult, CheckAsync>> {
    // For the moment, we fully ignore the bias on commands...
    const size = this.lengthArb.generate(mrng, undefined);
    const sizeValue = size.value;
    const items: Value<CommandWrapper<Model, Real, RunResult, CheckAsync>>[] = Array(sizeValue);
    for (let idx = 0; idx !== sizeValue; ++idx) {
      // ...even when generating the commands themselves
      const item = this.oneCommandArb.generate(mrng, undefined);
      items[idx] = item;
    }
    this.replayPathPosition = 0; // reset replay
    return this.buildValueFor(items, false);
  }

  canShrinkWithoutContext(value: unknown): value is CommandsIterable<Model, Real, RunResult, CheckAsync> {
    // Not supported yet on commands
    return false;
  }

  /** Filter commands based on the real status of the execution */
  private filterOnExecution(itemsRaw: Value<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]) {
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
  private filterOnReplay(itemsRaw: Value<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]) {
    return itemsRaw.filter((c, idx) => {
      const state = this.replayPath[this.replayPathPosition + idx];
      if (state === undefined) throw new Error(`Too short replayPath`);
      if (!state && c.value_.hasRan) throw new Error(`Mismatch between replayPath and real execution`);
      return state;
    });
  }

  /** Filter commands for shrinking purposes */
  private filterForShrinkImpl(itemsRaw: Value<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]) {
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
  ): Stream<Value<CommandsIterable<Model, Real, RunResult, CheckAsync>>> {
    if (context === undefined) {
      return Stream.nil<Value<CommandsIterable<Model, Real, RunResult, CheckAsync>>>();
    }
    const safeContext = context as CommandsArbitraryContext<Model, Real, RunResult, CheckAsync>;

    const shrunkOnce = safeContext.shrunkOnce;
    const itemsRaw = safeContext.items;

    const items = this.filterForShrinkImpl(itemsRaw); // filter out commands that have not been executed
    if (items.length === 0) {
      return Stream.nil<Value<CommandsIterable<Model, Real, RunResult, CheckAsync>>>();
    }

    // The shrinker of commands have to keep the last item
    // because it is the one causing the failure
    const rootShrink: Stream<Value<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]> = shrunkOnce
      ? Stream.nil()
      : new Stream([[]][Symbol.iterator]());

    // If the resulting shrinkable was simply built by joining the streams one by one,
    //  > stream[n] = stream[n-1].join(nextFor[n]) -- with nextFor[-1] = rootShrink
    // we would run into stack overflows when calling next to get back the 1st element (for huge n).
    // Indeed calling stream[n].next() would require to call stream[n-1].next() and so on...
    // Instead of that we define stream[n] = rootShrink.join(nextFor[0], ..., nextFor[n])
    // So that calling next on stream[n] will not have to run too many recursions
    const nextShrinks: IterableIterator<Value<CommandWrapper<Model, Real, RunResult, CheckAsync>>[]>[] = [];

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
      return this.buildValueFor(
        shrinkables.map((c) => new Value(c.value_.clone(), c.context)),
        true
      );
    });
  }
}
