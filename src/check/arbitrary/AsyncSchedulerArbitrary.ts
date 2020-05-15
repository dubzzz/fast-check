import { cloneMethod } from '../symbols';
import { Random } from '../../random/generator/Random';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';
import { stringify } from '../../utils/stringify';
import { escapeForTemplateString } from './helpers/TextEscaper';

/** Define an item to be passed to `scheduleSequence` */
export type SchedulerSequenceItem = { builder: () => Promise<any>; label: string } | (() => Promise<any>);

export interface SchedulerConstraints {
  /** Ensure that all scheduled tasks will be executed in the right context (for instance it can be the `act` of React) */
  act: (f: () => Promise<void>) => Promise<unknown>;
}

/**
 * Instance able to reschedule the ordering of promises
 * for a given app
 */
export interface Scheduler {
  /** Wrap a new task using the Scheduler */
  schedule: <T>(task: Promise<T>, label?: string) => Promise<T>;

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
  scheduleSequence(
    sequenceBuilders: SchedulerSequenceItem[]
  ): { done: boolean; faulty: boolean; task: Promise<{ done: boolean; faulty: boolean }> };

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
   * including the ones that might be created by one of the resolved task
   */
  waitAll: () => Promise<void>;
}

/** @hidden */
type ScheduledTask = {
  original: PromiseLike<unknown>;
  scheduled: PromiseLike<unknown>;
  trigger: () => void;
  taskId: number;
  label: string;
};

/** @hidden */
type TaskSelector = {
  clone: () => TaskSelector;
  nextTaskIndex: (scheduledTasks: ScheduledTask[]) => number;
};

/** @hidden */
class SchedulerImplem implements Scheduler {
  private lastTaskId: number;
  private readonly sourceTaskSelector: TaskSelector;
  private readonly scheduledTasks: ScheduledTask[];
  private readonly triggeredTasksLogs: string[];

  constructor(readonly act: (f: () => Promise<void>) => Promise<unknown>, private readonly taskSelector: TaskSelector) {
    this.lastTaskId = 0;
    this.sourceTaskSelector = taskSelector.clone();
    this.scheduledTasks = [];
    this.triggeredTasksLogs = [];
  }

  private buildLog(taskId: number, meta: string, type: 'resolved' | 'rejected' | 'pending', data: unknown) {
    return `[task\${${taskId}}] ${meta} ${type}${
      data !== undefined ? ` with value ${escapeForTemplateString(stringify(data))}` : ''
    }`;
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
      taskId,
      label: this.buildLog(taskId, meta, 'pending', undefined)
    });
    return scheduledPromise;
  }

  schedule<T>(task: Promise<T>, label?: string) {
    return this.scheduleInternal(label === undefined ? 'promise' : `promise::${label}`, task);
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

    let resolveSequenceTask = () => {};
    const sequenceTask = new Promise<void>(resolve => (resolveSequenceTask = resolve));

    sequenceBuilders
      .reduce((previouslyScheduled: PromiseLike<any>, item: SchedulerSequenceItem) => {
        const [builder, label] = typeof item === 'function' ? [item, item.name] : [item.builder, item.label];
        return previouslyScheduled.then(() => {
          // We schedule a successful promise that will trigger builder directly when triggered
          const scheduled = this.scheduleInternal(`sequence::${label}`, dummyResolvedPromise, () => builder());
          scheduled.catch(() => {
            status.faulty = true;
            resolveSequenceTask();
          });
          return scheduled;
        });
      }, dummyResolvedPromise)
      .then(
        () => {
          status.done = true;
          resolveSequenceTask();
        },
        () => {
          /* Discarding UnhandledPromiseRejectionWarning */
          /* No need to call resolveSequenceTask as it should already have been triggered */
        }
      );

    // TODO Prefer getter instead of sharing the variable itself
    //      Would need to stop supporting <es5
    // return {
    //   get done() { return status.done },
    //   get faulty() { return status.faulty }
    // };
    return Object.assign(status, {
      task: Promise.resolve(sequenceTask).then(() => {
        return { done: status.done, faulty: status.faulty };
      })
    });
  }

  count() {
    return this.scheduledTasks.length;
  }

  private async internalWaitOne() {
    if (this.scheduledTasks.length === 0) {
      throw new Error('No task scheduled');
    }
    const taskIndex = this.taskSelector.nextTaskIndex(this.scheduledTasks);
    const [scheduledTask] = this.scheduledTasks.splice(taskIndex, 1);
    scheduledTask.trigger(); // release the promise
    try {
      await scheduledTask.scheduled; // wait for its completion
    } catch (_err) {
      // We ignore failures here, we just want to wait the promise to be resolved (failure or success)
    }
  }

  async waitOne() {
    await this.act(async () => await this.internalWaitOne());
  }

  async waitAll() {
    while (this.scheduledTasks.length > 0) {
      await this.waitOne();
    }
  }

  toString() {
    return (
      'schedulerFor()`\n' +
      this.triggeredTasksLogs
        .concat(this.scheduledTasks.map(t => t.label))
        .map(log => `-> ${log}`)
        .join('\n') +
      '`'
    );
  }

  [cloneMethod]() {
    return new SchedulerImplem(this.act, this.sourceTaskSelector);
  }
}

/** @hidden */
class SchedulerArbitrary extends Arbitrary<Scheduler> {
  constructor(readonly act: (f: () => Promise<void>) => Promise<unknown>) {
    super();
  }

  generate(mrng: Random) {
    const buildNextTaskIndex = (r: Random) => {
      return {
        clone: () => buildNextTaskIndex(r.clone()),
        nextTaskIndex: (scheduledTasks: ScheduledTask[]) => {
          return r.nextInt(0, scheduledTasks.length - 1);
        }
      };
    };
    return new Shrinkable(new SchedulerImplem(this.act, buildNextTaskIndex(mrng.clone())));
  }
}

/**
 * For scheduler of promises
 */
function scheduler(constraints?: SchedulerConstraints): Arbitrary<Scheduler> {
  const { act = (f: () => Promise<void>) => f() } = constraints || {};
  return new SchedulerArbitrary(act);
}

/**
 * For custom scheduler with predefined resolution order
 *
 * Ordering is defined by using a template string like the one generated in case of failure of a {@link scheduler}
 *
 * It may be something like:
 * ```typescript
 * fc.schedulerFor()`
 *   -> [task\${2}] promise pending
 *   -> [task\${3}] promise pending
 *   -> [task\${1}] promise pending
 * `
 * ```
 *
 * Or more generally:
 * ```typescript
 * fc.schedulerFor()`
 *   This scheduler will resolve task ${2} first
 *   followed by ${3} and only then task ${1}
 * `
 * ```
 *
 * WARNING:
 * Custom scheduler will
 * neither check that all the referred promises have been scheduled
 * nor that they resolved with the same status and value.
 *
 *
 * WARNING:
 * If one the promises is wrongly defined it will fail - for instance asking to resolve 5 while 5 does not exist.
 */
function schedulerFor(
  constraints?: SchedulerConstraints
): (_strs: TemplateStringsArray, ...ordering: number[]) => Scheduler;
/**
 * For custom scheduler with predefined resolution order
 *
 * WARNING:
 * Custom scheduler will not check that all the referred promises have been scheduled.
 *
 *
 * WARNING:
 * If one the promises is wrongly defined it will fail - for instance asking to resolve 5 while 5 does not exist.
 *
 * @param customOrdering Array defining in which order the promises will be resolved.
 * Id of the promises start at 1. 1 means first scheduled promise, 2 second scheduled promise and so on.
 */
function schedulerFor(customOrdering: number[], constraints?: SchedulerConstraints): Scheduler;
function schedulerFor(
  customOrderingOrConstraints: number[] | SchedulerConstraints | undefined,
  constraintsOrUndefined?: SchedulerConstraints
): any {
  // Extract passed constraints
  const { act = (f: () => Promise<void>) => f() } = Array.isArray(customOrderingOrConstraints)
    ? constraintsOrUndefined || {}
    : customOrderingOrConstraints || {};

  const buildSchedulerFor = function(ordering: number[]) {
    const buildNextTaskIndex = () => {
      let numTasks = 0;
      return {
        clone: () => buildNextTaskIndex(),
        nextTaskIndex: (scheduledTasks: ScheduledTask[]) => {
          if (ordering.length <= numTasks) {
            throw new Error(`Invalid schedulerFor defined: too many tasks have been scheduled`);
          }
          const taskIndex = scheduledTasks.findIndex(t => t.taskId === ordering[numTasks]);
          if (taskIndex === -1) {
            throw new Error(`Invalid schedulerFor defined: unable to find next task`);
          }
          ++numTasks;
          return taskIndex;
        }
      };
    };
    return new SchedulerImplem(act, buildNextTaskIndex());
  };
  if (Array.isArray(customOrderingOrConstraints)) {
    return buildSchedulerFor(customOrderingOrConstraints);
  } else {
    return function(_strs: TemplateStringsArray, ...ordering: number[]) {
      return buildSchedulerFor(ordering);
    };
  }
}

export { scheduler, schedulerFor };
