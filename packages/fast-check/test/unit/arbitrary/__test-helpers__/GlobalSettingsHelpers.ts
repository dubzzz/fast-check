import type { GlobalParameters } from '../../../../src/check/runner/configuration/GlobalParameters.js';
import { configureGlobal, readConfigureGlobal } from '../../../../src/check/runner/configuration/GlobalParameters.js';

export function withConfiguredGlobal<T>(params: GlobalParameters, fun: () => T): T {
  const previousParams = readConfigureGlobal();
  try {
    configureGlobal(params);
    return fun();
  } finally {
    configureGlobal(previousParams || {});
  }
}
