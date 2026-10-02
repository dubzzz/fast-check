import type { Property } from '../property/types/Property.js';
import type { RunnerIterator } from './RunnerIterator.js';

export function propertyRunner<Ts>(
  runner: IterableIterator<Ts> & Pick<RunnerIterator<Ts>, 'handleResult'>,
  run: Property<Ts>['run'],
): Promise<void> | void {
  for (let v = runner.next(); !v.done; v = runner.next()) {
    const out = run(v.value);
    if (out !== null && 'then' in out) {
      return out.then((result) => {
        runner.handleResult(result);
        return propertyRunner(runner, run);
      });
    }
    runner.handleResult(out);
  }
}
