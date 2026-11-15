import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { Property } from '../property/types/Property.js';
import type { Plugin } from './Plugin.js';

/** @internal */
export function runCollector<Ts>(onCollect: (value: Ts) => void, runPredicate: boolean): Plugin<Ts> {
  const collect = (value: Ts, out: Awaited<ReturnType<Property<Ts>['run']>>) => {
    if (PreconditionFailure.isFailure(out)) {
      return out;
    }
    onCollect(value);
    return out === null ? null : new PreconditionFailure(true);
  };
  return () => ({
    decorateRun: (nestedRun) => (value, context) => {
      const out = runPredicate ? nestedRun(value, context) : null;
      return out !== null && 'then' in out ? out.then((result) => collect(value, result)) : collect(value, out);
    },
  });
}
