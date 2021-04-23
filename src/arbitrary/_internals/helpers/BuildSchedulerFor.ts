import { Scheduler } from '../interfaces/Scheduler';
import { ScheduledTask, SchedulerImplem, TaskSelector } from '../implementations/SchedulerImplem';

/** @internal */
export function buildNextTaskIndex<TMetaData>(ordering: number[]): TaskSelector<TMetaData> {
  let numTasks = 0;
  return {
    clone: (): TaskSelector<TMetaData> => buildNextTaskIndex(ordering),
    nextTaskIndex: (scheduledTasks: ScheduledTask<TMetaData>[]): number => {
      if (ordering.length <= numTasks) {
        throw new Error(`Invalid schedulerFor defined: too many tasks have been scheduled`);
      }
      const taskIndex = scheduledTasks.findIndex((t) => t.taskId === ordering[numTasks]);
      if (taskIndex === -1) {
        throw new Error(`Invalid schedulerFor defined: unable to find next task`);
      }
      ++numTasks;
      return taskIndex;
    },
  };
}

/** @internal */
export function buildSchedulerFor<TMetaData>(
  act: (f: () => Promise<void>) => Promise<unknown>,
  ordering: number[]
): Scheduler<TMetaData> {
  return new SchedulerImplem<TMetaData>(act, buildNextTaskIndex(ordering));
}
