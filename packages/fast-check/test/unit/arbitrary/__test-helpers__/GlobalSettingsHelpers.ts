import type {
  GlobalParameters} from '../../../../src/check/runner/configuration/GlobalParameters';
import {
  configureGlobal,
  readConfigureGlobal,
} from '../../../../src/check/runner/configuration/GlobalParameters';

export function withConfiguredGlobal<T>(params: GlobalParameters, fun: () => T): T {
  const previousParams = readConfigureGlobal();
  try {
    configureGlobal(params);
    return fun();
  } finally {
    configureGlobal(previousParams || {});
  }
}
