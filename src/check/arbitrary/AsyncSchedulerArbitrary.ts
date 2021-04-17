import { cloneMethod } from '../symbols';
import { Random } from '../../random/generator/Random';
import { Arbitrary } from './definition/Arbitrary';
import { stringify } from '../../utils/stringify';
import { escapeForTemplateString } from './helpers/TextEscaper';
import { NextArbitrary } from './definition/NextArbitrary';
import { convertFromNext } from './definition/Converters';
import { Stream } from '../../fast-check-default';
import { NextValue } from './definition/NextValue';

/**
 * Define an item to be passed to `scheduleSequence`
 * @remarks Since 1.20.0
 * @public
 */
export type SchedulerSequenceItem<TMetaData = unknown> =
  | {
      /**
       * Builder to start the task
       * @remarks Since 1.20.0
       */
      builder: () => Promise<any>;
      /**
       * Label
       * @remarks Since 1.20.0
       */
      label: string;
      /**
       * Metadata to be attached into logs
       * @remarks Since 1.25.0
       */
      metadata?: TMetaData;
    }
  | (() => Promise<any>);

/**
 * Describe a task for the report produced by the scheduler
 * @remarks Since 1.25.0
 * @public
 */
export interface SchedulerReportItem<TMetaData = unknown> {
  /**
   * Execution status for this task
   * - resolved: task released by the scheduler and successful
   * - rejected: task released by the scheduler but with errors
   * - pending:  task still pending in the scheduler, not released yet
   *
   * @remarks Since 1.25.0
   */
  status: 'resolved' | 'rejected' | 'pending';
  /**
   * How was this task scheduled?
   * - promise: schedule
   * - function: scheduleFunction
   * - sequence: scheduleSequence
   *
   * @remarks Since 1.25.0
   */
  schedulingType: 'promise' | 'function' | 'sequence';
  /**
   * Incremental id for the task, first received task has taskId = 1
   * @remarks Since 1.25.0
   */
  taskId: number;
  /**
   * Label of the task
   * @remarks Since 1.25.0
   */
  label: string;
  /**
   * Metadata linked when scheduling the task
   * @remarks Since 1.25.0
   */
  metadata?: TMetaData;
  /**
   * Stringified version of the output or error computed using fc.stringify
   * @remarks Since 1.25.0
   */
  outputValue?: string;
}

/**
 * Constraints to be applied on {@link scheduler}
 * @remarks Since 2.2.0
 * @public
 */
export interface SchedulerConstraints {
  /**
   * Ensure that all scheduled tasks will be executed in the right context (for instance it can be the `act` of React)
   * @remarks Since 1.21.0
   */
  act: (f: () => Promise<void>) => Promise<unknown>;
}

/**
 * Instance able to reschedule the ordering of promises for a given app
 * @remarks Since 1.20.0
 * @public
 */
export interface Scheduler<TMetaData = unknown> {
  /**
   * Wrap a new task using the Scheduler
   * @remarks Since 1.20.0
   */
  schedule: <T>(task: Promise<T>, label?: string, metadata?: TMetaData) => Promise<T>;

  /**
   * Automatically wrap function output using the Scheduler
   * @remarks Since 1.20.0
   */
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
   *
   * @remarks Since 1.20.0
   */
  scheduleSequence(
    sequenceBuilders: SchedulerSequenceItem<TMetaData>[]
  ): { done: boolean; faulty: boolean; task: Promise<{ done: boolean; faulty: boolean }> };

  /**
   * Count of pending scheduled tasks
   * @remarks Since 1.20.0
   */
  count(): number;

  /**
   * Wait one scheduled task to be executed
   * @throws Whenever there is no task scheduled
   * @remarks Since 1.20.0
   */
  waitOne: () => Promise<void>;

  /**
   * Wait all scheduled tasks,
   * including the ones that might be created by one of the resolved task
   * @remarks Since 1.20.0
   */
  waitAll: () => Promise<void>;

  /**
   * Produce an array containing all the scheduled tasks so far with their execution status.
   * If the task has been executed, it includes a string representation of the associated output or error produced by the task if any.
   *
   * Tasks will be returned in the order they get executed by the scheduler.
   *
   * @remarks Since 1.25.0
   */
  report: () => SchedulerReportItem<TMetaData>[];
}

/** @internal */
type TriggeredTask<TMetaData> = {
  status: 'resolved' | 'rejected';
  schedulingType: 'promise' | 'function' | 'sequence';
  taskId: number;
  label: string;
  metadata?: TMetaData;
  outputValue: string | undefined;
};

/** @internal */
type ScheduledTask<TMetaData> = {
  original: PromiseLike<unknown>;
  scheduled: PromiseLike<unknown>;
  trigger: () => void;
  schedulingType: 'promise' | 'function' | 'sequence';
  taskId: number;
  label: string;
  metadata?: TMetaData;
};

/** @internal */
type TaskSelector<TMetaData> = {
  clone: () => TaskSelector<TMetaData>;
  nextTaskIndex: (scheduledTasks: ScheduledTask<TMetaData>[]) => number;
};

/** @internal */
class SchedulerImplem<TMetaData> implements Scheduler<TMetaData> {
  private lastTaskId: number;
  private readonly sourceTaskSelector: TaskSelector<TMetaData>;
  private readonly scheduledTasks: ScheduledTask<TMetaData>[];
  private readonly triggeredTasks: TriggeredTask<TMetaData>[];

  constructor(
    readonly act: (f: () => Promise<void>) => Promise<unknown>,
    private readonly taskSelector: TaskSelector<TMetaData>
  ) {
    this.lastTaskId = 0;
    this.sourceTaskSelector = taskSelector.clone();
    this.scheduledTasks = [];
    this.triggeredTasks = [];
  }

  private static buildLog<TMetaData>(reportItem: SchedulerReportItem<TMetaData>) {
    return `[task\${${reportItem.taskId}}] ${
      reportItem.label.length !== 0 ? `${reportItem.schedulingType}::${reportItem.label}` : reportItem.schedulingType
    } ${reportItem.status}${
      reportItem.outputValue !== undefined ? ` with value ${escapeForTemplateString(reportItem.outputValue)}` : ''
    }`;
  }

  private log(
    schedulingType: 'promise' | 'function' | 'sequence',
    taskId: number,
    label: string,
    metadata: TMetaData | undefined,
    status: 'resolved' | 'rejected',
    data: unknown
  ) {
    this.triggeredTasks.push({
      status,
      schedulingType,
      taskId,
      label,
      metadata,
      outputValue: data !== undefined ? stringify(data) : undefined,
    });
  }

  private scheduleInternal<T>(
    schedulingType: 'promise' | 'function' | 'sequence',
    label: string,
    task: PromiseLike<T>,
    metadata: TMetaData | undefined,
    thenTaskToBeAwaited?: () => PromiseLike<T>
  ) {
    let trigger: (() => void) | null = null;
    const taskId = ++this.lastTaskId;
    const scheduledPromise = new Promise<T>((resolve, reject) => {
      trigger = () => {
        (thenTaskToBeAwaited ? task.then(() => thenTaskToBeAwaited()) : task).then(
          (data) => {
            this.log(schedulingType, taskId, label, metadata, 'resolved', data);
            return resolve(data);
          },
          (err) => {
            this.log(schedulingType, taskId, label, metadata, 'rejected', err);
            return reject(err);
          }
        );
      };
    });
    this.scheduledTasks.push({
      original: task,
      scheduled: scheduledPromise,
      // `trigger` will always be initialised at this point: body of `new Promise` has already been executed
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      trigger: trigger!,
      schedulingType,
      taskId,
      label,
      metadata,
    });
    return scheduledPromise;
  }

  schedule<T>(task: Promise<T>, label?: string, metadata?: TMetaData) {
    return this.scheduleInternal('promise', label || '', task, metadata);
  }

  scheduleFunction<TArgs extends any[], T>(
    asyncFunction: (...args: TArgs) => Promise<T>
  ): (...args: TArgs) => Promise<T> {
    return (...args: TArgs) =>
      this.scheduleInternal(
        'function',
        `${asyncFunction.name}(${args.map(stringify).join(',')})`,
        asyncFunction(...args),
        undefined
      );
  }

  scheduleSequence(sequenceBuilders: SchedulerSequenceItem<TMetaData>[]) {
    // We run all the builders sequencially
    // BUT we allow tasks scheduled outside of this sequence
    //     to be called between two of our builders
    const status = { done: false, faulty: false };
    const dummyResolvedPromise: PromiseLike<any> = { then: (f: () => any) => f() };

    // Placeholder resolver, immediately replaced by the one retrieved in `new Promise`
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let resolveSequenceTask = () => {};
    const sequenceTask = new Promise<void>((resolve) => (resolveSequenceTask = resolve));

    sequenceBuilders
      .reduce((previouslyScheduled: PromiseLike<any>, item: SchedulerSequenceItem<TMetaData>) => {
        const [builder, label, metadata] =
          typeof item === 'function' ? [item, item.name, undefined] : [item.builder, item.label, item.metadata];
        return previouslyScheduled.then(() => {
          // We schedule a successful promise that will trigger builder directly when triggered
          const scheduled = this.scheduleInternal('sequence', label, dummyResolvedPromise, metadata, () => builder());
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
      }),
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

  report() {
    return [
      ...this.triggeredTasks,
      ...this.scheduledTasks.map(
        (t): SchedulerReportItem<TMetaData> => ({
          status: 'pending',
          schedulingType: t.schedulingType,
          taskId: t.taskId,
          label: t.label,
          metadata: t.metadata,
        })
      ),
    ];
  }

  toString() {
    return (
      'schedulerFor()`\n' +
      this.report()
        .map(SchedulerImplem.buildLog)
        .map((log) => `-> ${log}`)
        .join('\n') +
      '`'
    );
  }

  [cloneMethod]() {
    return new SchedulerImplem(this.act, this.sourceTaskSelector);
  }
}

/** @internal */
class SchedulerArbitrary<TMetaData> extends NextArbitrary<Scheduler<TMetaData>> {
  constructor(readonly act: (f: () => Promise<void>) => Promise<unknown>) {
    super();
  }

  generate(mrng: Random, _biasFactor: number | undefined): NextValue<Scheduler<TMetaData>> {
    const buildNextTaskIndex = (r: Random) => {
      return {
        clone: () => buildNextTaskIndex(r.clone()),
        nextTaskIndex: (scheduledTasks: ScheduledTask<TMetaData>[]) => {
          return r.nextInt(0, scheduledTasks.length - 1);
        },
      };
    };
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

/**
 * For scheduler of promises
 * @remarks Since 1.20.0
 * @public
 */
function scheduler<TMetaData = unknown>(constraints?: SchedulerConstraints): Arbitrary<Scheduler<TMetaData>> {
  const { act = (f: () => Promise<void>) => f() } = constraints || {};
  return convertFromNext(new SchedulerArbitrary<TMetaData>(act));
}

/**
 * For custom scheduler with predefined resolution order
 *
 * Ordering is defined by using a template string like the one generated in case of failure of a {@link scheduler}
 *
 * It may be something like:
 *
 * @example
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
 *
 * @remarks Since 1.25.0
 * @public
 */
function schedulerFor<TMetaData = unknown>(
  constraints?: SchedulerConstraints
): (_strs: TemplateStringsArray, ...ordering: number[]) => Scheduler<TMetaData>;
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
 * @param customOrdering - Array defining in which order the promises will be resolved.
 * Id of the promises start at 1. 1 means first scheduled promise, 2 second scheduled promise and so on.
 *
 * @remarks Since 1.25.0
 * @public
 */
function schedulerFor<TMetaData = unknown>(
  customOrdering: number[],
  constraints?: SchedulerConstraints
): Scheduler<TMetaData>;
function schedulerFor<TMetaData = unknown>(
  customOrderingOrConstraints: number[] | SchedulerConstraints | undefined,
  constraintsOrUndefined?: SchedulerConstraints
): any {
  // Extract passed constraints
  const { act = (f: () => Promise<void>) => f() } = Array.isArray(customOrderingOrConstraints)
    ? constraintsOrUndefined || {}
    : customOrderingOrConstraints || {};

  const buildSchedulerFor = function (ordering: number[]) {
    const buildNextTaskIndex = () => {
      let numTasks = 0;
      return {
        clone: () => buildNextTaskIndex(),
        nextTaskIndex: (scheduledTasks: ScheduledTask<TMetaData>[]) => {
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
    };
    return new SchedulerImplem<TMetaData>(act, buildNextTaskIndex());
  };
  if (Array.isArray(customOrderingOrConstraints)) {
    return buildSchedulerFor(customOrderingOrConstraints);
  } else {
    return function (_strs: TemplateStringsArray, ...ordering: number[]) {
      return buildSchedulerFor(ordering);
    };
  }
}

export { scheduler, schedulerFor };
