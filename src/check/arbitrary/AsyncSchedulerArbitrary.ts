// asyncScheduler
// taskScheduler
// asyncOrchestrator

// produce a scheduler
// with schedule and schedulable method
// plus waitAll and waitOne methods

interface IScheduler {
  schedule: <T>(task: PromiseLike<T>) => PromiseLike<T>;
  schedulable: <TArgs extends any[], T>(
    asyncFunction: (...args: TArgs) => PromiseLike<T>
  ) => (...args: TArgs) => PromiseLike<T>;

  waitOne: () => Promise<void>;
  waitAll: () => Promise<void>;
}

type ScheduledTask = {
  original: PromiseLike<unknown>;
  scheduled: PromiseLike<unknown>;
  trigger: () => void;
};

class Scheduler implements IScheduler {
  private readonly scheduledTasks: ScheduledTask[];

  schedule<T>(task: PromiseLike<T>) {
    let trigger: (() => void) | null = null;
    const scheduledPromise = new Promise<T>(resolve => {
      trigger = () => {
        task.then(resolve);
      };
    });
    this.scheduledTasks.push({ original: task, scheduled: scheduledPromise, trigger: trigger! });
    return scheduledPromise;
  }

  schedulable<TArgs extends any[], T>(
    asyncFunction: (...args: TArgs) => PromiseLike<T>
  ): (...args: TArgs) => PromiseLike<T> {
    return (...args: TArgs) => this.schedule(asyncFunction(...args));
  }

  async waitOne() {
    // TODO random id
    const taskIndex = 0;
    const [scheduledTask] = this.scheduledTasks.splice(taskIndex, 1);
    scheduledTask.trigger(); // release the promise
    await scheduledTask.scheduled; // wait for its completion
  }

  async waitAll() {
    while (this.scheduledTasks.length > 0) {
      await this.waitOne();
    }
  }
}
