import type { GlobalParameters } from '../../../../src/check/runner/configuration/GlobalParameters.js';
import {
  readGlobalConfiguration,
  extendGlobalConfiguration,
} from '../../../../src/check/runner/configuration/GlobalParameters.js';

export function withConfiguredGlobal<T>(params: GlobalParameters, fun: () => T): T {
  const previousParams = readGlobalConfiguration();
  try {
    extendGlobalConfiguration(params);
    return fun();
  } finally {
    extendGlobalConfiguration(() => previousParams);
  }
}
