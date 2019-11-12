import { cloneMethod } from '../symbols';
import { Random } from '../../random/generator/Random';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';
import { stringify } from '../../utils/stringify';

// asyncScheduler
// taskScheduler
// asyncOrchestrator

// produce a scheduler
// with schedule and schedulable method
// plus waitAll and waitOne methods

export interface Scheduler {
  /** Wrap a new task using the Scheduler */
  schedule: <T>(task: PromiseLike<T>) => PromiseLike<T>;

  /** Automatically wrap function output using the Scheduler */
  scheduleFunction: <TArgs extends any[], T>(
    asyncFunction: (...args: TArgs) => PromiseLike<T>
  ) => (...args: TArgs) => PromiseLike<T>;

  /**
   * Count of pending scheduled tasks
   */
  count(): number;

  /**
   * Wait one scheduled task to be executed
   * @throws Whenever there is no task scheduled
   */
  waitOne: () => Promise<void>;

  /**
   * Wait all scheduled tasks,
   * including the ones that might be greated by one of the resolved task
   */
  waitAll: () => Promise<void>;
}

type ScheduledTask = {
  original: PromiseLike<unknown>;
  scheduled: PromiseLike<unknown>;
  trigger: () => void;
};

export class SchedulerImplem implements Scheduler {
  private readonly sourceMrng: Random;
  private readonly scheduledTasks: ScheduledTask[];
  private readonly triggeredTasksLogs: string[];

  constructor(private readonly mrng: Random) {
    // here we should received an already cloned mrng so that we can do whatever we want on it
    this.sourceMrng = mrng.clone();
    this.scheduledTasks = [];
  }

  private log(meta: string, type: 'resolve' | 'reject', data: any[]) {
    this.triggeredTasksLogs.push(`[${meta}][${type}] ${stringify(data)}`);
  }

  private scheduleInternal<T>(meta: string, task: PromiseLike<T>) {
    let trigger: (() => void) | null = null;
    const scheduledPromise = new Promise<T>((resolve, reject) => {
      trigger = () => {
        task.then(
          (...args) => {
            this.log(meta, 'resolve', args);
            return resolve(...args);
          },
          (...args) => {
            this.log(meta, 'reject', args);
            return reject(...args);
          }
        );
      };
    });
    this.scheduledTasks.push({ original: task, scheduled: scheduledPromise, trigger: trigger! });
    return scheduledPromise;
  }

  schedule<T>(task: PromiseLike<T>) {
    return this.scheduleInternal('promise', task);
  }

  scheduleFunction<TArgs extends any[], T>(
    asyncFunction: (...args: TArgs) => PromiseLike<T>
  ): (...args: TArgs) => PromiseLike<T> {
    return (...args: TArgs) => this.scheduleInternal(`function::${asyncFunction.name}`, asyncFunction(...args));
  }

  count() {
    return this.scheduledTasks.length;
  }

  async waitOne() {
    if (this.scheduledTasks.length === 0) {
      throw new Error('No task scheduled');
    }
    const taskIndex = this.mrng.nextInt(0, this.scheduledTasks.length - 1);
    const [scheduledTask] = this.scheduledTasks.splice(taskIndex, 1);
    scheduledTask.trigger(); // release the promise
    await scheduledTask.scheduled; // wait for its completion
  }

  async waitAll() {
    while (this.scheduledTasks.length > 0) {
      await this.waitOne();
    }
  }

  toString() {
    return this.triggeredTasksLogs.map(log => `-> ${log}`).join('\n');
  }

  [cloneMethod]() {
    return new SchedulerImplem(this.sourceMrng);
  }
}

class SchedulerArbitrary extends Arbitrary<Scheduler> {
  generate(mrng: Random) {
    return new Shrinkable(new SchedulerImplem(mrng.clone()));
  }
}

export function scheduler(): Arbitrary<Scheduler> {
  return new SchedulerArbitrary();
}
