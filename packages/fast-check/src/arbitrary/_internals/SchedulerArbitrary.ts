import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../check/arbitrary/definition/Value.js';
import type { Random } from '../../random/generator/Random.js';
import { Stream } from '../../stream/Stream.js';
import type { Scheduler } from './interfaces/Scheduler.js';
import type { ScheduledTask, TaskSelector } from './implementations/SchedulerImplem.js';
import { SchedulerImplem } from './implementations/SchedulerImplem.js';

/**
 * @internal
 * Passed instance of mrng should never be altered from the outside.
 * Passed instance will never be affected by current code but always cloned before usage.
 */
function buildNextTaskIndex<TMetaData>(mrng: Random): TaskSelector<TMetaData> {
  const clonedMrng = mrng.clone();
  return {
    clone: (): TaskSelector<TMetaData> => buildNextTaskIndex(clonedMrng),
    nextTaskIndex: (scheduledTasks: ScheduledTask<TMetaData>[]): number => {
      return mrng.nextInt(0, scheduledTasks.length - 1);
    },
  };
}

/** @internal */
export class SchedulerArbitrary<TMetaData> extends Arbitrary<Scheduler<TMetaData>> {
  constructor(readonly act: (f: () => Promise<void>) => Promise<unknown>) {
    super();
  }

  generate(mrng: Random, _biasFactor: number | undefined): Value<Scheduler<TMetaData>> {
    return new Value(new SchedulerImplem<TMetaData>(this.act, buildNextTaskIndex(mrng.clone())), undefined);
  }

  canShrinkWithoutContext(value: unknown): value is Scheduler<TMetaData> {
    // Not supported yet
    return false;
  }

  shrink(_value: Scheduler<TMetaData>, _context?: unknown): Stream<Value<Scheduler<TMetaData>>> {
    // Not supported yet
    return Stream.nil();
  }
}
