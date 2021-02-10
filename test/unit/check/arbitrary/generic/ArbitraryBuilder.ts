import { ArbitraryWithContextualShrink } from '../../../../../src/check/arbitrary/definition/ArbitraryWithContextualShrink';
import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { Random } from '../../../../../src/random/generator/Random';
import { stream, Stream } from '../../../../../src/stream/Stream';

type ArbitraryForDefinition<T> = {
  value: T;
  shrinks?: ArbitraryForDefinition<T>[];
};

class ArbitraryFor<T> extends ArbitraryWithContextualShrink<T> {
  private runId: number;
  constructor(readonly defs: ArbitraryForDefinition<T>[]) {
    super();
    this.runId = 0;
  }
  private shrinkableFromDefinition(def: ArbitraryForDefinition<T>): Shrinkable<T> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const arb = this;
    function* g(): IterableIterator<Shrinkable<T>> {
      for (const s of def.shrinks || []) {
        yield arb.shrinkableFromDefinition(s);
      }
    }
    return new Shrinkable(def.value, () => stream(g()));
  }
  private findDefinitionFor(defs: ArbitraryForDefinition<T>[], v: T): ArbitraryForDefinition<T> | null {
    for (const def of defs) {
      if (def.value === v) return def;
      const subDef = this.findDefinitionFor(def.shrinks || [], v);
      if (subDef !== null) return subDef;
    }
    return null;
  }
  generate(_mrng: Random): Shrinkable<T> {
    const def = this.defs[this.runId++];
    if (def === undefined) throw new Error(`Trying to generate a value out of the definition scope`);
    return this.shrinkableFromDefinition(def);
  }
  contextualShrink(value: T, _context?: unknown): Stream<[T, unknown]> {
    const def = this.findDefinitionFor(this.defs, value);
    if (def === null) return Stream.nil();

    const g = function* (): IterableIterator<[T, unknown]> {
      for (const s of def.shrinks || []) {
        yield [s.value, undefined];
      }
    };
    return stream(g());
  }
  shrunkOnceContext(): unknown {
    return undefined;
  }
}

export const arbitraryFor = <T>(defs: ArbitraryForDefinition<T>[]): ArbitraryWithContextualShrink<T> => {
  return new ArbitraryFor(defs);
};
