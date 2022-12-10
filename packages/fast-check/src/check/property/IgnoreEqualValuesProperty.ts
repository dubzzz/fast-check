import { IRawProperty } from './IRawProperty';
import { Random } from '../../random/generator/Random';
import { stringify } from '../../utils/stringify';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { Value } from '../arbitrary/definition/Value';
import { Stream } from '../../stream/Stream';

/** @internal */
function fromSyncCached<Ts>(
  cachedValue: ReturnType<IRawProperty<Ts, false>['run']>
): ReturnType<IRawProperty<Ts, false>['run']> {
  return cachedValue === null ? new PreconditionFailure() : cachedValue;
}

/** @internal */
function fromCached<Ts>(
  cachedValue: ReturnType<IRawProperty<Ts, false>['run']>,
  isAsync: false
): ReturnType<IRawProperty<Ts, false>['run']>;
/** @internal */
function fromCached<Ts>(
  cachedValue: ReturnType<IRawProperty<Ts, true>['run']>,
  isAsync: true
): ReturnType<IRawProperty<Ts, true>['run']>;
function fromCached<Ts>(
  ...data: [ReturnType<IRawProperty<Ts, true>['run']>, true] | [ReturnType<IRawProperty<Ts, false>['run']>, false]
) {
  if (data[1]) return data[0].then(fromSyncCached);
  return fromSyncCached(data[0]);
}

/** @internal */
function fromCachedUnsafe<Ts, IsAsync extends boolean>(
  cachedValue: ReturnType<IRawProperty<Ts, IsAsync>['run']>,
  isAsync: IsAsync
): ReturnType<IRawProperty<Ts, IsAsync>['run']> {
  return fromCached(cachedValue as any, isAsync as any) as any;
}

/** @internal */
export class IgnoreEqualValuesProperty<Ts, IsAsync extends boolean> implements IRawProperty<Ts, IsAsync> {
  runBeforeEach?: () => (IsAsync extends true ? Promise<void> : never) | (IsAsync extends false ? void : never);
  runAfterEach?: () => (IsAsync extends true ? Promise<void> : never) | (IsAsync extends false ? void : never);
  private coveredCases: Map<string, ReturnType<IRawProperty<Ts, IsAsync>['run']>> = new Map();

  constructor(readonly property: IRawProperty<Ts, IsAsync>, readonly skipRuns: boolean) {
    if (this.property.runBeforeEach !== undefined && this.property.runAfterEach !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.runBeforeEach = () => this.property.runBeforeEach!();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.runAfterEach = () => this.property.runAfterEach!();
    }
  }

  isAsync(): IsAsync {
    return this.property.isAsync();
  }

  generate(mrng: Random, runId?: number): Value<Ts> {
    return this.property.generate(mrng, runId);
  }

  shrink(value: Value<Ts>): Stream<Value<Ts>> {
    return this.property.shrink(value);
  }

  run(v: Ts, dontRunHook: boolean): ReturnType<IRawProperty<Ts, IsAsync>['run']> {
    const stringifiedValue = stringify(v);
    if (this.coveredCases.has(stringifiedValue)) {
      const lastOutput = this.coveredCases.get(stringifiedValue) as ReturnType<IRawProperty<Ts, IsAsync>['run']>;
      if (!this.skipRuns) {
        return lastOutput;
      }
      return fromCachedUnsafe(lastOutput, this.property.isAsync());
    }
    const out = this.property.run(v, dontRunHook);
    this.coveredCases.set(stringifiedValue, out);
    return out;
  }
}
