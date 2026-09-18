type RunnerType = 'test' | 'it';

export type RunOptions = {
  specName: string;
  runnerName: RunnerType;
  useWorkers: boolean;
  testRunner: 'jasmine' | undefined;
};

export const runOptions: RunOptions[] = [
  { specName: 'test', runnerName: 'test', useWorkers: false, testRunner: undefined },
  { specName: 'test (worker)', runnerName: 'test', useWorkers: true, testRunner: undefined },
  { specName: 'test (jasmine)', runnerName: 'test', useWorkers: false, testRunner: 'jasmine' },
  { specName: 'test (jasmine)(worker)', runnerName: 'test', useWorkers: true, testRunner: 'jasmine' },
  { specName: 'it', runnerName: 'it', useWorkers: false, testRunner: undefined },
];

export const testRunOptions: RunOptions = runOptions[0];
export const testWorkerRunOptions: RunOptions = runOptions[1];
