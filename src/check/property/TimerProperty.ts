import { INextRawProperty } from './INextRawProperty';
import { Random } from '../../random/generator/Random';
import { NextValue } from '../arbitrary/definition/NextValue';
import { Stream } from '../../stream/Stream';
import { performance } from 'perf_hooks';

export const __fc_generateTime = Symbol('__fc_generateTime');
export const __fc_runTime = Symbol('__fc_runTime');
export const __fc_allTime_start = Symbol('__fc_allTime');

/** @internal */
export class TimerProperty<Ts, IsAsync extends boolean> implements INextRawProperty<Ts, IsAsync> {
  constructor(readonly property: INextRawProperty<Ts, IsAsync>) {}

  isAsync(): IsAsync {
    return this.property.isAsync();
  }

  generate(mrng: Random, runId?: number): NextValue<Ts> {
    const startTime = performance.now();
    const out = this.property.generate(mrng, runId);
    (global as any)[__fc_generateTime] += performance.now() - startTime;
    return out;
  }

  shrink(value: NextValue<Ts>): Stream<NextValue<Ts>> {
    return this.property.shrink(value);
  }

  run(v: Ts): ReturnType<INextRawProperty<Ts, IsAsync>['run']> {
    const startTime = performance.now();
    const out = this.property.run(v);
    if (out !== null && 'then' in (out as any)) {
      return (out as ReturnType<INextRawProperty<Ts, true>['run']>).finally(() => {
        (global as any)[__fc_runTime] += performance.now() - startTime;
      }) as ReturnType<INextRawProperty<Ts, IsAsync>['run']>;
    }
    (global as any)[__fc_runTime] += performance.now() - startTime;
    return out;
  }
}
