import { escapeForTemplateString } from '../../../check/arbitrary/helpers/TextEscaper';
import { cloneMethod } from '../../../check/symbols';
import { stringify } from '../../../utils/stringify';
import { Scheduler, SchedulerReportItem, SchedulerSequenceItem } from '../interfaces/Scheduler';

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
export type ScheduledTask<TMetaData> = {
  original: PromiseLike<unknown>;
  scheduled: PromiseLike<unknown>;
  trigger: () => void;
  schedulingType: 'promise' | 'function' | 'sequence';
  taskId: number;
  label: string;
  metadata?: TMetaData;
};

/** @internal */
export type TaskSelector<TMetaData> = {
  clone: () => TaskSelector<TMetaData>;
  nextTaskIndex: (scheduledTasks: ScheduledTask<TMetaData>[]) => number;
};

/** @internal */
export class SchedulerImplem<TMetaData> implements Scheduler<TMetaData> {
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
  ): Promise<T> {
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

  schedule<T>(task: Promise<T>, label?: string, metadata?: TMetaData): Promise<T> {
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

  scheduleSequence(sequenceBuilders: SchedulerSequenceItem<TMetaData>[]): {
    done: boolean;
    faulty: boolean;
    task: Promise<{ done: boolean; faulty: boolean }>;
  } {
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

  count(): number {
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

  async waitOne(): Promise<void> {
    await this.act(async () => await this.internalWaitOne());
  }

  async waitAll(): Promise<void> {
    while (this.scheduledTasks.length > 0) {
      await this.waitOne();
    }
  }

  report(): SchedulerReportItem<TMetaData>[] {
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

  toString(): string {
    return (
      'schedulerFor()`\n' +
      this.report()
        .map(SchedulerImplem.buildLog)
        .map((log) => `-> ${log}`)
        .join('\n') +
      '`'
    );
  }

  [cloneMethod](): Scheduler<TMetaData> {
    return new SchedulerImplem(this.act, this.sourceTaskSelector);
  }
}
