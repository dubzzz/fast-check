import type { PluginInstance } from '../plugin/Plugin.js';
import type { RunDetails } from './reporter/RunDetails.js';
import { runAllCallbacksAndReturn } from './utils/AllCallbacksThenReturnRunner.js';

function extractFollowUps<Ts>(pluginInstances: PluginInstance<Ts>[]) {
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
  return followUps;
}

/**
 * Run clean-up and post-completion plugins' methods
 * This function never throw synchronously but may reject asynchronously
 */
export function pluginCompletionRunner<Ts>(
  pluginInstances: PluginInstance<Ts>[],
  runDetails: Promise<RunDetails<Ts>> | RunDetails<Ts>,
): Promise<RunDetails<Ts>> | RunDetails<Ts> {
  const followUps = extractFollowUps(pluginInstances);
  if (followUps.length === 0) {
    return runDetails;
  }
  return 'then' in runDetails
    ? Promise.resolve(runDetails).then((details) => runAllCallbacksAndReturn(details, followUps))
    : runAllCallbacksAndReturn(runDetails, followUps);
}
