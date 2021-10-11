import { INextRawProperty } from './INextRawProperty';
import { Random } from '../../random/generator/Random';
import { stringify } from '../../utils/stringify';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { NextValue } from '../arbitrary/definition/NextValue';
import { Stream } from '../../stream/Stream';

/** @internal */
function fromSyncCached<Ts>(
  cachedValue: ReturnType<INextRawProperty<Ts, false>['run']>
): ReturnType<INextRawProperty<Ts, false>['run']> {
  return cachedValue === null ? new PreconditionFailure() : cachedValue;
}

/** @internal */
function fromCached<Ts>(
  cachedValue: ReturnType<INextRawProperty<Ts, false>['run']>,
  isAsync: false
): ReturnType<INextRawProperty<Ts, false>['run']>;
/** @internal */
function fromCached<Ts>(
  cachedValue: ReturnType<INextRawProperty<Ts, true>['run']>,
  isAsync: true
): ReturnType<INextRawProperty<Ts, true>['run']>;
function fromCached<Ts>(
  ...data:
    | [ReturnType<INextRawProperty<Ts, true>['run']>, true]
    | [ReturnType<INextRawProperty<Ts, false>['run']>, false]
) {
  if (data[1]) return data[0].then(fromSyncCached);
  return fromSyncCached(data[0]);
}

/** @internal */
function fromCachedUnsafe<Ts, IsAsync extends boolean>(
  cachedValue: ReturnType<INextRawProperty<Ts, IsAsync>['run']>,
  isAsync: IsAsync
): ReturnType<INextRawProperty<Ts, IsAsync>['run']> {
  return fromCached(cachedValue as any, isAsync as any) as any;
}

/** @internal */
export class IgnoreEqualValuesProperty<Ts, IsAsync extends boolean> implements INextRawProperty<Ts, IsAsync> {
  private coveredCases: Map<string, ReturnType<INextRawProperty<Ts, IsAsync>['run']>> = new Map();

  constructor(readonly property: INextRawProperty<Ts, IsAsync>, readonly skipRuns: boolean) {}

  isAsync(): IsAsync {
    return this.property.isAsync();
  }

  generate(mrng: Random, runId?: number): NextValue<Ts> {
    return this.property.generate(mrng, runId);
  }

  shrink(value: NextValue<Ts>): Stream<NextValue<Ts>> {
    return this.property.shrink(value);
  }

  run(v: Ts): ReturnType<INextRawProperty<Ts, IsAsync>['run']> {
    const stringifiedValue = stringify(v);
    if (this.coveredCases.has(stringifiedValue)) {
      const lastOutput = this.coveredCases.get(stringifiedValue) as ReturnType<INextRawProperty<Ts, IsAsync>['run']>;
      if (!this.skipRuns) {
        return lastOutput;
      }
      return fromCachedUnsafe(lastOutput, this.property.isAsync());
    }
    const out = this.property.run(v);
    this.coveredCases.set(stringifiedValue, out);
    return out;
  }
}
