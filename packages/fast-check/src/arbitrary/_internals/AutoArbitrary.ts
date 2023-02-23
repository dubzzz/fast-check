import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { AutoContext, AutoValue, buildAutoValue, PreBuiltValue } from './builders/AutoValueBuilder';
import { tupleShrink } from './TupleArbitrary';

export class AutoArbitrary extends Arbitrary<AutoValue> {
  generate(mrng: Random, biasFactor: number | undefined): Value<AutoValue> {
    return buildAutoValue(mrng, biasFactor, () => []);
  }

  canShrinkWithoutContext(value: unknown): value is AutoValue {
    // Auto can NEVER shrink without any context as there is no way to find back what to call to apply the shrink
    return false;
  }

  shrink(_value: AutoValue, context: unknown): Stream<Value<AutoValue>> {
    if (context === undefined) {
      // Auto can NEVER shrink without any context as there is no way to find back what to call to apply the shrink
      return Stream.nil();
    }
    const safeContext = context as AutoContext;
    const mrng = safeContext.mrng;
    const biasFactor = safeContext.biasFactor;
    const history = safeContext.history;
    return tupleShrink(
      history.map((c) => c.arb),
      history.map((c) => c.value),
      history.map((c) => c.context)
    ).map((shrink): Value<AutoValue> => {
      function computePreBuiltValues(): PreBuiltValue[] {
        const subValues = shrink.value; // trigger an explicit access to the value in case it needs to be cloned
        const subContexts = shrink.context;
        return history.map((entry, index) => ({
          arb: entry.arb,
          value: subValues[index],
          context: subContexts[index],
        }));
      }
      return buildAutoValue(mrng, biasFactor, computePreBuiltValues);
    });
  }
}
