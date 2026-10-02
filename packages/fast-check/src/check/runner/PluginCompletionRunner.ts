import type { PluginInstance } from '../plugin/Plugin.js';
import type { RunDetails } from './reporter/RunDetails.js';

export function pluginCompletionRunner<Ts>(
  pluginInstances: PluginInstance<Ts>[],
  runDetails: Promise<RunDetails<Ts>> | RunDetails<Ts>,
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
    return Promise.resolve(runDetails);
  }
  return 'then' in runDetails
    ? Promise.resolve(runDetails).then((details) => runFollowUps(details, followUps))
    : runFollowUps(runDetails, followUps);
}

// Helpers

async function runFollowUps<Ts>(
  details: RunDetails<Ts>,
  followUps: NonNullable<PluginInstance<Ts>['onAllRunsComplete']>[],
) {
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
}
