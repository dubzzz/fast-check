import type { Property } from '../types/Property.js';
import type { Random } from '../../../random/generator/Random.js';
import { stringify } from '../../../utils/stringify.js';
import { PreconditionFailure } from '../../precondition/PreconditionFailure.js';
import type { Value } from '../../arbitrary/definition/Value.js';

/** @internal */
function fromSyncCached<Ts>(
  cachedValue: Awaited<ReturnType<Property<Ts>['run']>>,
): Awaited<ReturnType<Property<Ts>['run']>> {
  return cachedValue === null ? new PreconditionFailure() : cachedValue;
}

/** @internal */
function fromCached<Ts>(cachedValue: ReturnType<Property<Ts>['run']>): ReturnType<Property<Ts>['run']> {
  if (cachedValue !== null && typeof cachedValue === 'object' && 'then' in cachedValue) {
    return cachedValue.then(fromSyncCached);
  }
  // We actually received a synchronous value
  return fromSyncCached(cachedValue);
}

/** @internal */
export class IgnoreEqualValuesProperty<Ts> implements Property<Ts> {
  private coveredCases: Map<string, ReturnType<Property<Ts>['run']>> = new Map();

  constructor(
    readonly property: Property<Ts>,
    readonly skipRuns: boolean,
  ) {}

  generate(mrng: Random, runId?: number): Value<Ts> {
    return this.property.generate(mrng, runId);
  }

  shrink(value: Value<Ts>): IteratorObject<Value<Ts>> {
    return this.property.shrink(value);
  }

  run(v: Ts): ReturnType<Property<Ts>['run']> {
    const stringifiedValue = stringify(v);
    const lastOutput = this.coveredCases.get(stringifiedValue);
    if (lastOutput !== undefined) {
      if (!this.skipRuns) {
        return lastOutput;
      }
      return fromCached(lastOutput);
    }
    const out = this.property.run(v);
    this.coveredCases.set(stringifiedValue, out);
    return out;
  }

  runBeforeEach(): ReturnType<Property<Ts>['runBeforeEach']> {
    return this.property.runBeforeEach();
  }

  runAfterEach(): ReturnType<Property<Ts>['runAfterEach']> {
    return this.property.runAfterEach();
  }
}
