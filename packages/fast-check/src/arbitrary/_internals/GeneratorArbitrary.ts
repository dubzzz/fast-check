import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import type { Value } from '../../check/arbitrary/definition/Value';
import type { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { safeMap } from '../../utils/globals';
import type { GeneratorContext, GeneratorValue, PreBuiltValue } from './builders/GeneratorValueBuilder';
import { buildGeneratorValue } from './builders/GeneratorValueBuilder';
import { buildStableArbitraryGeneratorCache, naiveIsEqual } from './builders/StableArbitraryGeneratorCache';
import { tupleShrink } from './TupleArbitrary';

/**
 * The generator arbitrary is responsible to generate instances of {@link GeneratorValue}.
 * These instances can be used to produce "random values" within the tests themselves while still
 * providing a bit of shrinking capabilities (not all).
 */
export class GeneratorArbitrary extends Arbitrary<GeneratorValue> {
  private readonly arbitraryCache = buildStableArbitraryGeneratorCache(naiveIsEqual);

  generate(mrng: Random, biasFactor: number | undefined): Value<GeneratorValue> {
    return buildGeneratorValue(mrng, biasFactor, () => [], this.arbitraryCache);
  }

  canShrinkWithoutContext(value: unknown): value is GeneratorValue {
    // Auto can NEVER shrink without any context as there is no way to find back what to call to apply the shrink
    return false;
  }

  shrink(_value: GeneratorValue, context: unknown): Stream<Value<GeneratorValue>> {
    if (context === undefined) {
      // Auto can NEVER shrink without any context as there is no way to find back what to call to apply the shrink
      return Stream.nil();
    }
    const safeContext = context as GeneratorContext;
    const mrng = safeContext.mrng;
    const biasFactor = safeContext.biasFactor;
    const history = safeContext.history;
    return tupleShrink(
      history.map((c) => c.arb),
      history.map((c) => c.value),
      history.map((c) => c.context),
    ).map((shrink): Value<GeneratorValue> => {
      function computePreBuiltValues(): PreBuiltValue[] {
        const subValues = shrink.value; // trigger an explicit access to the value in case it needs to be cloned
        const subContexts = shrink.context;
        return safeMap(history, (entry, index) => ({
          arb: entry.arb,
          value: subValues[index],
          context: subContexts[index],
          mrng: entry.mrng,
        }));
      }
      return buildGeneratorValue(mrng, biasFactor, computePreBuiltValues, this.arbitraryCache);
    });
  }
}
