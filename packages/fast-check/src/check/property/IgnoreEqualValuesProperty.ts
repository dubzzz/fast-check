import type { IRawProperty } from './IRawProperty.js';
import type { Random } from '../../random/generator/Random.js';
import { stringify } from '../../utils/stringify.js';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { Value } from '../arbitrary/definition/Value.js';
import type { Stream } from '../../stream/Stream.js';

/** @internal */
function fromCached<Ts>(
  cachedValue: ReturnType<IRawProperty<Ts>['run']>,
): ReturnType<IRawProperty<Ts>['run']> {
  const fromSyncCached = (v: Awaited<ReturnType<IRawProperty<Ts>['run']>>) =>
    v === null ? new PreconditionFailure() : v;
  if (cachedValue !== null && typeof cachedValue === 'object' && 'then' in cachedValue) {
    return cachedValue.then(fromSyncCached);
  }
  return fromSyncCached(cachedValue);
}

/** @internal */
export class IgnoreEqualValuesProperty<Ts> implements IRawProperty<Ts> {
  private coveredCases: Map<string, ReturnType<IRawProperty<Ts>['run']>> = new Map();

  constructor(
    readonly property: IRawProperty<Ts>,
    readonly skipRuns: boolean,
  ) {}

  generate(mrng: Random, runId?: number): Value<Ts> {
    return this.property.generate(mrng, runId);
  }

  shrink(value: Value<Ts>): Stream<Value<Ts>> {
    return this.property.shrink(value);
  }

  run(v: Ts): ReturnType<IRawProperty<Ts>['run']> {
    const stringifiedValue = stringify(v);
    if (this.coveredCases.has(stringifiedValue)) {
      const lastOutput = this.coveredCases.get(stringifiedValue) as ReturnType<IRawProperty<Ts>['run']>;
      if (!this.skipRuns) {
        return lastOutput;
      }
      return fromCached(lastOutput);
    }
    const out = this.property.run(v);
    this.coveredCases.set(stringifiedValue, out);
    return out;
  }

  runBeforeEach(): ReturnType<IRawProperty<Ts>['runBeforeEach']> {
    return this.property.runBeforeEach();
  }

  runAfterEach(): ReturnType<IRawProperty<Ts>['runAfterEach']> {
    return this.property.runAfterEach();
  }
}
