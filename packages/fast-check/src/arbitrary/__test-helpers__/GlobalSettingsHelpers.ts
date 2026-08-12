import type { GlobalParameters } from '../../check/runner/configuration/GlobalParameters.js';
import { configureGlobal, readConfigureGlobal } from '../../check/runner/configuration/GlobalParameters.js';

export function withConfiguredGlobal<T>(params: GlobalParameters, fun: () => T): T {
  const previousParams = readConfigureGlobal();
  try {
    configureGlobal(params);
    return fun();
  } finally {
    configureGlobal(previousParams || {});
  }
}
