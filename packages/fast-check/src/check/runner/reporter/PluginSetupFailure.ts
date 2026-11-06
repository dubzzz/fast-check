import type { QualifiedParameters } from '../configuration/QualifiedParameters.js';
import type { RunDetailsFailurePluginSetup } from './RunDetails.js';

export function createPluginSetupFailureDetails<Ts>(
  qParams: QualifiedParameters<Ts>,
  errorInstance: unknown,
): RunDetailsFailurePluginSetup<Ts> {
  return {
    failed: true,
    interrupted: false,
    numRuns: 0,
    numSkips: 0,
    numShrinks: 0,
    seed: qParams.seed,
    counterexample: null,
    counterexamplePath: null,
    errorInstance,
    failures: [],
    executionSummary: [],
    verbose: qParams.verbose,
    runConfiguration: qParams.toParameters(),
  };
}
