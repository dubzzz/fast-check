import { NextArbitrary } from '../../check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../check/arbitrary/definition/NextValue';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Scheduler } from './interfaces/Scheduler';
import { ScheduledTask, SchedulerImplem, TaskSelector } from './implementations/SchedulerImplem';

/** @internal */
function buildNextTaskIndex<TMetaData>(mrng: Random): TaskSelector<TMetaData> {
  return {
    clone: (): TaskSelector<TMetaData> => buildNextTaskIndex(mrng.clone()),
    nextTaskIndex: (scheduledTasks: ScheduledTask<TMetaData>[]): number => {
      return mrng.nextInt(0, scheduledTasks.length - 1);
    },
  };
}

/** @internal */
export class SchedulerArbitrary<TMetaData> extends NextArbitrary<Scheduler<TMetaData>> {
  constructor(readonly act: (f: () => Promise<void>) => Promise<unknown>) {
    super();
  }

  generate(mrng: Random, _biasFactor: number | undefined): NextValue<Scheduler<TMetaData>> {
    return new NextValue(new SchedulerImplem<TMetaData>(this.act, buildNextTaskIndex(mrng.clone())));
  }

  canGenerate(value: unknown): value is Scheduler<TMetaData> {
    // Not supported yet
    return false;
  }

  shrink(_value: Scheduler<TMetaData>, _context?: unknown): Stream<NextValue<Scheduler<TMetaData>>> {
    // Not supported yet
    return Stream.nil();
  }
}
