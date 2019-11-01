import { cloneMethod } from '../symbols';
import { Random } from '../../random/generator/Random';

// asyncScheduler
// taskScheduler
// asyncOrchestrator

// produce a scheduler
// with schedule and schedulable method
// plus waitAll and waitOne methods

interface Scheduler {
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

class SchedulerImplem implements Scheduler {
  private readonly sourceMrng: Random;
  private readonly mrng: Random;
  private readonly scheduledTasks: ScheduledTask[];

  constructor(mrng: Random) {
    this.sourceMrng = mrng.clone(); // TODO check if we need to clone twice
    this.mrng = mrng.clone();
  }

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

  [cloneMethod]() {
    return new SchedulerImplem(this.sourceMrng);
  }
}
