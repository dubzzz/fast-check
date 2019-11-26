import { cloneMethod } from '../symbols';
import { Random } from '../../random/generator/Random';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';
import { stringify } from '../../utils/stringify';

export type SchedulerSequenceItem = { builder: () => Promise<any>; label: string } | (() => Promise<any>);

export interface Scheduler {
  /** Wrap a new task using the Scheduler */
  schedule: <T>(task: Promise<T>) => Promise<T>;

  /** Automatically wrap function output using the Scheduler */
  scheduleFunction: <TArgs extends any[], T>(
    asyncFunction: (...args: TArgs) => Promise<T>
  ) => (...args: TArgs) => Promise<T>;

  /**
   * Schedule a sequence of Promise to be executed sequencially.
   * Items within the sequence might be interleaved by other scheduled operations.
   *
   * Please note that whenever an item from the sequence has started,
   * the scheduler will wait until its end before moving to another scheduled task.
   *
   * A handle is returned by the function in order to monitor the state of the sequence.
   * Sequence will be marked:
   * - done if all the promises have been executed properly
   * - faulty if one of the promises within the sequence throws
   */
  scheduleSequence(sequenceBuilders: SchedulerSequenceItem[]): { done: boolean; faulty: boolean };

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
  label: string;
};

export class SchedulerImplem implements Scheduler {
  private lastTaskId: number;
  private readonly sourceMrng: Random;
  private readonly scheduledTasks: ScheduledTask[];
  private readonly triggeredTasksLogs: string[];

  constructor(private readonly mrng: Random) {
    this.lastTaskId = 0;
    // here we should received an already cloned mrng so that we can do whatever we want on it
    this.sourceMrng = mrng.clone();
    this.scheduledTasks = [];
    this.triggeredTasksLogs = [];
  }

  private buildLog(taskId: number, meta: string, type: 'resolved' | 'rejected' | 'pending', data: unknown) {
    return `[task#${taskId}] ${meta} ${type}${data !== undefined ? ` with value ${stringify(data)}` : ''}`;
  }

  private log(taskId: number, meta: string, type: 'resolved' | 'rejected' | 'pending', data: unknown) {
    this.triggeredTasksLogs.push(this.buildLog(taskId, meta, type, data));
  }

  private scheduleInternal<T>(meta: string, task: PromiseLike<T>, thenTaskToBeAwaited?: () => PromiseLike<T>) {
    let trigger: (() => void) | null = null;
    const taskId = ++this.lastTaskId;
    const scheduledPromise = new Promise<T>((resolve, reject) => {
      trigger = () => {
        (thenTaskToBeAwaited ? task.then(() => thenTaskToBeAwaited()) : task).then(
          data => {
            this.log(taskId, meta, 'resolved', data);
            return resolve(data);
          },
          err => {
            this.log(taskId, meta, 'rejected', err);
            return reject(err);
          }
        );
      };
    });
    this.scheduledTasks.push({
      original: task,
      scheduled: scheduledPromise,
      trigger: trigger!,
      label: this.buildLog(taskId, meta, 'pending', undefined)
    });
    return scheduledPromise;
  }

  schedule<T>(task: Promise<T>) {
    return this.scheduleInternal('promise', task);
  }

  scheduleFunction<TArgs extends any[], T>(
    asyncFunction: (...args: TArgs) => Promise<T>
  ): (...args: TArgs) => Promise<T> {
    return (...args: TArgs) =>
      this.scheduleInternal(
        `function::${asyncFunction.name}(${args.map(stringify).join(',')})`,
        asyncFunction(...args)
      );
  }

  scheduleSequence(sequenceBuilders: SchedulerSequenceItem[]) {
    // We run all the builders sequencially
    // BUT we allow tasks scheduled outside of this sequence
    //     to be called between two of our builders
    const status = { done: false, faulty: false };
    const dummyResolvedPromise: PromiseLike<any> = { then: (f: () => any) => f() };
    sequenceBuilders
      .reduce((previouslyScheduled: PromiseLike<any>, item: SchedulerSequenceItem) => {
        const [builder, label] = typeof item === 'function' ? [item, item.name] : [item.builder, item.label];
        return previouslyScheduled.then(() => {
          // We schedule a successful promise that will trigger builder directly when triggered
          const scheduled = this.scheduleInternal(`sequence::${label}`, dummyResolvedPromise, () => builder());
          scheduled.catch(() => (status.faulty = true));
          return scheduled;
        });
      }, dummyResolvedPromise)
      .then(
        () => (status.done = true),
        () => {
          /* Discarding UnhandledPromiseRejectionWarning */
        }
      );

    return status;
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
    try {
      await scheduledTask.scheduled; // wait for its completion
    } catch (_err) {
      // We ignore failures here, we just want to wait the promise to be resolved (failure or success)
    }
  }

  async waitAll() {
    while (this.scheduledTasks.length > 0) {
      await this.waitOne();
    }
  }

  toString() {
    return (
      'Scheduler`\n' +
      this.triggeredTasksLogs
        .concat(this.scheduledTasks.map(t => t.label))
        .map(log => `-> ${log}`)
        .join('\n') +
      '`'
    );
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
