import type { PluginInstance } from '../plugin/Plugin.js';
import type { RunDetails } from './reporter/RunDetails.js';

export function pluginCompletionRunner<Ts>(
  pluginInstances: PluginInstance<Ts>[],
  runDetailsPromise: Promise<RunDetails<Ts>>,
): Promise<RunDetails<Ts>> {
  const followUps: NonNullable<PluginInstance<Ts>['onAllRunsComplete']>[] = [];
  for (let index = 0; index !== pluginInstances.length; ++index) {
    const instance = pluginInstances[index];
    if (instance.onAllRunsComplete !== undefined) {
      // oxlint-disable-next-line typescript/no-non-null-assertion
      followUps.push((runDetails) => instance.onAllRunsComplete!(runDetails));
    }
  }
  for (let index = pluginInstances.length - 1; index >= 0; --index) {
    const instance = pluginInstances[index];
    if (instance.afterAll !== undefined) {
      // oxlint-disable-next-line typescript/no-non-null-assertion
      followUps.push(() => instance.afterAll!());
    }
  }
  if (followUps.length === 0) {
    return runDetailsPromise;
  }
  return runDetailsPromise.then(async (details) => {
    let interceptedOnce = false;
    let interceptedError: unknown = undefined;
    for (const followUp of followUps) {
      try {
        const out = followUp(details);
        if (out !== undefined) {
          await out;
        }
      } catch (error) {
        if (!interceptedOnce) {
          interceptedOnce = true;
          interceptedError = error;
        }
      }
    }
    if (interceptedOnce) {
      throw interceptedError;
    }
    return details;
  });
}
