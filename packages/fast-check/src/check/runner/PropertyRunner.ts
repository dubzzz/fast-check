import type { Property } from '../property/types/Property.js';
import type { RunnerIterator } from './RunnerIterator.js';

async function asyncPropertyRunner<Ts>(
  runner: IterableIterator<Ts> & Pick<RunnerIterator<Ts>, 'handleResult'>,
  run: Property<Ts>['run'],
  firstResult: Promise<Awaited<ReturnType<Property<Ts>['run']>>>,
): Promise<void> {
  runner.handleResult(await firstResult);
  for (let v = runner.next(); !v.done; v = runner.next()) {
    const out = run(v.value, {});
    runner.handleResult(out !== null && 'then' in out ? await out : out);
  }
}

export function propertyRunner<Ts>(
  runner: IterableIterator<Ts> & Pick<RunnerIterator<Ts>, 'handleResult'>,
  run: Property<Ts>['run'],
): Promise<void> | void {
  for (let v = runner.next(); !v.done; v = runner.next()) {
    const out = run(v.value, {});
    if (out !== null && 'then' in out) {
      return asyncPropertyRunner(runner, run, out);
    }
    runner.handleResult(out);
  }
}
