import type { Property } from '../property/types/Property.js';
import type { RunExecution } from './reporter/RunExecution.js';
import type { RunnerIterator } from './RunnerIterator.js';

export function propertyRunner<Ts>(
  runner: RunnerIterator<Ts>,
  run: Property<Ts>['run'],
): Promise<RunExecution<Ts>> | RunExecution<Ts> {
  for (const v of runner) {
    const out = run(v);
    if (out !== null && 'then' in out) {
      return out.then((result) => {
        runner.handleResult(result);
        return propertyRunner(runner, run);
      });
    }
    runner.handleResult(out);
  }
  return runner.runExecution;
}
