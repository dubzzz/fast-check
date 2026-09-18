type RunnerType = 'test' | 'it';

export type RunOptions = {
  specName: string;
  runnerName: RunnerType;
  useWorkers: boolean;
  testRunner: 'jasmine' | undefined;
};

export const testRunOptions: RunOptions = {
  specName: 'test',
  runnerName: 'test',
  useWorkers: false,
  testRunner: undefined,
};

export const testWorkerRunOptions: RunOptions = {
  specName: 'test (worker)',
  runnerName: 'test',
  useWorkers: true,
  testRunner: undefined,
};

export const testJasmineRunOptions: RunOptions = {
  specName: 'test (jasmine)',
  runnerName: 'test',
  useWorkers: false,
  testRunner: 'jasmine',
};

export const testJasmineWorkerRunOptions: RunOptions = {
  specName: 'test (jasmine)(worker)',
  runnerName: 'test',
  useWorkers: true,
  testRunner: 'jasmine',
};

export const itRunOptions: RunOptions = {
  specName: 'it',
  runnerName: 'it',
  useWorkers: false,
  testRunner: undefined,
};
