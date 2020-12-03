import { ArbitraryWithShrink } from '../../../../../src/check/arbitrary/definition/ArbitraryWithShrink';
import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { Random } from '../../../../../src/random/generator/Random';
import { stream, Stream } from '../../../../../src/stream/Stream';

type ArbitraryForDefinition<T> = {
  value: T;
  shrinks?: ArbitraryForDefinition<T>[];
};

class ArbitraryFor<T> extends ArbitraryWithShrink<T> {
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
  shrink(value: T, _shrunkOnce?: boolean): Stream<T> {
    const def = this.findDefinitionFor(this.defs, value);
    if (def === null) return Stream.nil();

    const g = function* (): IterableIterator<T> {
      for (const s of def.shrinks || []) {
        yield s.value;
      }
    };
    return stream(g());
  }
}

export const arbitraryFor = <T>(defs: ArbitraryForDefinition<T>[]): ArbitraryWithShrink<T> => {
  return new ArbitraryFor(defs);
};
