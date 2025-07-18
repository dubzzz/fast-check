import { escapeForTemplateString } from '../helpers/TextEscaper';
import { cloneMethod } from '../../../check/symbols';
import type { WithCloneMethod } from '../../../check/symbols';
import { stringify } from '../../../utils/stringify';
import type { Scheduler, SchedulerAct, SchedulerReportItem, SchedulerSequenceItem } from '../interfaces/Scheduler';

const defaultSchedulerAct: SchedulerAct = (f: () => Promise<void>) => f();

/**
 * Number of ticks we perform before scheduling anything in waitFor
 * @internal
 */
export const numTicksBeforeScheduling = 50;

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
  trigger: () => Promise<unknown>;
  schedulingType: 'promise' | 'function' | 'sequence';
  taskId: number;
  label: string;
  metadata?: TMetaData;
  customAct: SchedulerAct;
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
  private readonly scheduledWatchers: (() => void)[];

  constructor(
    readonly act: (f: () => Promise<void>) => Promise<unknown>,
    private readonly taskSelector: TaskSelector<TMetaData>,
  ) {
    this.lastTaskId = 0;
    this.sourceTaskSelector = taskSelector.clone();
    this.scheduledTasks = [];
    this.triggeredTasks = [];
    this.scheduledWatchers = [];
    (this as unknown as WithCloneMethod<unknown>)[cloneMethod] = function (
      this: SchedulerImplem<TMetaData>,
    ): Scheduler<TMetaData> {
      return new SchedulerImplem(this.act, this.sourceTaskSelector);
    };
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
    data: unknown,
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
    customAct: SchedulerAct,
    thenTaskToBeAwaited?: () => PromiseLike<T>,
  ): Promise<T> {
    const taskId = ++this.lastTaskId;
    let trigger: (() => Promise<unknown>) | undefined = undefined;
    const scheduledPromise = new Promise<T>((resolve, reject) => {
      trigger = () => {
        const promise = Promise.resolve(
          thenTaskToBeAwaited !== undefined ? task.then(() => thenTaskToBeAwaited()) : task,
        );
        promise.then(
          (data) => {
            this.log(schedulingType, taskId, label, metadata, 'resolved', data);
            resolve(data);
          },
          (err) => {
            this.log(schedulingType, taskId, label, metadata, 'rejected', err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(err);
          },
        );
        return promise;
      };
    });
    this.scheduledTasks.push({
      original: task,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      trigger: trigger!,
      schedulingType,
      taskId,
      label,
      metadata,
      customAct,
    });
    if (this.scheduledWatchers.length !== 0) {
      this.scheduledWatchers[0]();
    }
    return scheduledPromise;
  }

  schedule<T>(task: Promise<T>, label?: string, metadata?: TMetaData, customAct?: SchedulerAct): Promise<T> {
    return this.scheduleInternal('promise', label || '', task, metadata, customAct || defaultSchedulerAct);
  }

  scheduleFunction<TArgs extends any[], T>(
    asyncFunction: (...args: TArgs) => Promise<T>,
    customAct?: SchedulerAct,
  ): (...args: TArgs) => Promise<T> {
    return (...args: TArgs) =>
      this.scheduleInternal(
        'function',
        `${asyncFunction.name}(${args.map(stringify).join(',')})`,
        asyncFunction(...args),
        undefined,
        customAct || defaultSchedulerAct,
      );
  }

  scheduleSequence(
    sequenceBuilders: SchedulerSequenceItem<TMetaData>[],
    customAct?: SchedulerAct,
  ): {
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
    const sequenceTask = new Promise<{ done: boolean; faulty: boolean }>((resolve) => {
      resolveSequenceTask = () => resolve({ done: status.done, faulty: status.faulty });
    });

    const onFaultyItemNoThrow = () => {
      status.faulty = true;
      resolveSequenceTask();
    };
    const onDone = () => {
      status.done = true;
      resolveSequenceTask();
    };

    const registerNextBuilder = (index: number, previous: PromiseLike<unknown>) => {
      if (index >= sequenceBuilders.length) {
        // All builders have been scheduled, we handle termination:
        // if the last one succeeds then we are done, if it fails then the sequence should be marked as failed
        previous.then(onDone, onFaultyItemNoThrow);
        return;
      }
      previous.then(() => {
        const item = sequenceBuilders[index];
        const [builder, label, metadata] =
          typeof item === 'function' ? [item, item.name, undefined] : [item.builder, item.label, item.metadata];
        const scheduled = this.scheduleInternal(
          'sequence',
          label,
          dummyResolvedPromise,
          metadata,
          customAct || defaultSchedulerAct,
          () => builder(),
        );
        registerNextBuilder(index + 1, scheduled);
      }, onFaultyItemNoThrow);
    };

    registerNextBuilder(0, dummyResolvedPromise);

    // TODO Prefer getter instead of sharing the variable itself
    //      Would need to stop supporting <es5
    // return {
    //   get done() { return status.done },
    //   get faulty() { return status.faulty }
    // };
    return Object.assign(status, { task: sequenceTask });
  }

  count(): number {
    return this.scheduledTasks.length;
  }

  private internalWaitOne() {
    if (this.scheduledTasks.length === 0) {
      throw new Error('No task scheduled');
    }
    const taskIndex = this.taskSelector.nextTaskIndex(this.scheduledTasks);
    const [scheduledTask] = this.scheduledTasks.splice(taskIndex, 1);
    return scheduledTask.customAct(() => {
      const scheduled = scheduledTask.trigger(); // release the promise
      return scheduled.catch((_err) => {
        // We ignore failures here, we just want to wait the promise to be resolved (failure or success)
      }) as Promise<void>;
    });
  }

  waitOne(customAct?: SchedulerAct): Promise<void> {
    const waitAct = customAct || defaultSchedulerAct;
    const waitOneResult: Promise<unknown> = this.act(() => waitAct(() => this.internalWaitOne()));
    return waitOneResult as Promise<void>;
  }

  async waitAll(customAct?: SchedulerAct): Promise<void> {
    while (this.scheduledTasks.length > 0) {
      await this.waitOne(customAct);
    }
  }

  async internalWaitFor<T>(
    unscheduledTask: Promise<T>,
    options: {
      customAct: SchedulerAct | undefined;
      onWaitStart: (() => void) | undefined;
      onWaitIdle: (() => void) | undefined;
      launchAwaiterOnInit: boolean;
    },
  ): Promise<T> {
    let taskResolved = false;
    const customAct = options.customAct;
    const onWaitStart = options.onWaitStart;
    const onWaitIdle = options.onWaitIdle;
    const launchAwaiterOnInit = options.launchAwaiterOnInit;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let resolveFinal: (value: T) => void = undefined!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let rejectFinal: (error: unknown) => void = undefined!;

    // Define the lazy watchers: triggered whenever something new has been scheduled
    let awaiterTicks = 0;
    let awaiterPromise: Promise<void> | null = null;
    let awaiterScheduledTaskPromise: Promise<void> | null = null;
    const awaiter = async (): Promise<void> => {
      awaiterTicks = numTicksBeforeScheduling;
      for (awaiterTicks = numTicksBeforeScheduling; !taskResolved && awaiterTicks > 0; --awaiterTicks) {
        await Promise.resolve();
      }
      if (!taskResolved && this.scheduledTasks.length > 0) {
        if (onWaitStart !== undefined) {
          onWaitStart();
        }
        awaiterScheduledTaskPromise = this.waitOne(customAct); // no catch, should be catch by final user
        return awaiterScheduledTaskPromise.then(
          () => {
            awaiterScheduledTaskPromise = null;
            return awaiter(); // NOTE: waitOne does not throw, except throwing "act"
          },
          (err) => {
            awaiterScheduledTaskPromise = null;
            taskResolved = true;
            rejectFinal(err);
            throw err;
          },
        );
      }
      if (!taskResolved && onWaitIdle !== undefined) {
        onWaitIdle();
      }
      awaiterPromise = null;
    };
    const handleNotified = () => {
      if (awaiterPromise !== null) {
        // Awaiter is currently running, there is no need to relaunch it
        // but we can ask it for more ticks
        awaiterTicks = numTicksBeforeScheduling + 1; // +1 as 1 is running
        return;
      }
      // Schedule the next awaiter (awaiter will reset awaiterPromise to null)
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      awaiterPromise = awaiter().catch(() => {});
    };

    // Define the wrapping task and its resolution strategy
    const clearAndReplaceWatcher = () => {
      const handleNotifiedIndex = this.scheduledWatchers.indexOf(handleNotified);
      if (handleNotifiedIndex !== -1) {
        this.scheduledWatchers.splice(handleNotifiedIndex, 1);
      }
      if (handleNotifiedIndex === 0 && this.scheduledWatchers.length !== 0) {
        this.scheduledWatchers[0]();
      }
    };

    const finalTask = new Promise<T>((resolve, reject) => {
      resolveFinal = (value) => {
        clearAndReplaceWatcher();
        resolve(value);
      };
      rejectFinal = (error: unknown) => {
        clearAndReplaceWatcher();
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(error);
      };
    });

    unscheduledTask.then(
      (ret) => {
        taskResolved = true;
        if (awaiterScheduledTaskPromise === null) {
          resolveFinal(ret);
        } else {
          awaiterScheduledTaskPromise.then(
            () => resolveFinal(ret),
            (error) => rejectFinal(error),
          );
        }
      },
      (err) => {
        taskResolved = true;
        if (awaiterScheduledTaskPromise === null) {
          rejectFinal(err);
        } else {
          awaiterScheduledTaskPromise.then(
            () => rejectFinal(err),
            () => rejectFinal(err),
          );
        }
      },
    );

    // Simulate `handleNotified` is the number of waiting tasks is not zero
    // Must be called after unscheduledTask.then otherwise, a promise could be released while
    // we already have the value for unscheduledTask ready
    if ((this.scheduledTasks.length > 0 || launchAwaiterOnInit) && this.scheduledWatchers.length === 0) {
      handleNotified();
    }
    this.scheduledWatchers.push(handleNotified);

    return finalTask;
  }

  waitNext(count: number, customAct?: SchedulerAct): Promise<void> {
    let resolver: (() => void) | undefined = undefined;
    let remaining = count;
    const awaited =
      remaining <= 0
        ? Promise.resolve()
        : new Promise<void>((r) => {
            resolver = () => {
              if (--remaining <= 0) {
                r();
              }
            };
          });
    return this.internalWaitFor(awaited, {
      customAct,
      onWaitStart: resolver,
      onWaitIdle: undefined,
      launchAwaiterOnInit: false,
    });
  }

  waitIdle(customAct?: SchedulerAct): Promise<void> {
    let resolver: (() => void) | undefined = undefined;
    const awaited = new Promise<void>((r) => (resolver = r));
    return this.internalWaitFor(awaited, {
      customAct,
      onWaitStart: undefined,
      onWaitIdle: resolver,
      launchAwaiterOnInit: true,
    });
  }

  waitFor<T>(unscheduledTask: Promise<T>, customAct?: SchedulerAct): Promise<T> {
    return this.internalWaitFor(unscheduledTask, {
      customAct,
      onWaitStart: undefined,
      onWaitIdle: undefined,
      launchAwaiterOnInit: false,
    });
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
        }),
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
}
