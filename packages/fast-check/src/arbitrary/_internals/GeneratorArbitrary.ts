import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { GeneratorContext, GeneratorValue, buildGeneratorValue, PreBuiltValue } from './builders/GeneratorValueBuilder';
import { tupleShrink } from './TupleArbitrary';

/**
 * The generator arbitrary is responsible to generate instances of {@link GeneratorValue}.
 * These instances can be used to produce "random values" within the tests themselves while still
 * providing a bit of shrinking capabilities (not all).
 */
export class GeneratorArbitrary extends Arbitrary<GeneratorValue> {
  generate(mrng: Random, biasFactor: number | undefined): Value<GeneratorValue> {
    return buildGeneratorValue(mrng, biasFactor, () => [], naiveIsEqual);
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
      history.map((c) => c.context)
    ).map((shrink): Value<GeneratorValue> => {
      function computePreBuiltValues(): PreBuiltValue[] {
        const subValues = shrink.value; // trigger an explicit access to the value in case it needs to be cloned
        const subContexts = shrink.context;
        return history.map((entry, index) => ({
          arb: entry.arb,
          value: subValues[index],
          context: subContexts[index],
          mrng: entry.mrng,
        }));
      }
      return buildGeneratorValue(mrng, biasFactor, computePreBuiltValues, naiveIsEqual);
    });
  }
}

function naiveIsEqual(v1: unknown, v2: unknown): boolean {
  if (v1 !== null && typeof v1 === 'object' && v2 !== null && typeof v2 === 'object') {
    if (Array.isArray(v1)) {
      if (!Array.isArray(v2)) return false;
      if (v1.length !== v2.length) return false;
    } else if (Array.isArray(v2)) {
      return false;
    }

    if (Object.keys(v1).length !== Object.keys(v2).length) {
      return false;
    }
    for (const index in v1) {
      if (!(index in v2)) {
        return false;
      }
      if (!naiveIsEqual((v1 as any)[index], (v2 as any)[index])) {
        return false;
      }
    }
    return true;
  } else {
    return Object.is(v1, v2);
  }
}
