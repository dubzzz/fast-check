type RunnerType = 'test' | 'it';

type DescribeOptions = {
  specName: string;
  runnerName: RunnerType;
  useWorkers: boolean;
  testRunner: 'jasmine' | undefined;
};

export const runOptions: DescribeOptions[] = [
  { specName: 'test', runnerName: 'test', useWorkers: false, testRunner: undefined },
  { specName: 'test (worker)', runnerName: 'test', useWorkers: true, testRunner: undefined },
  { specName: 'test (jasmine)', runnerName: 'test', useWorkers: false, testRunner: 'jasmine' },
  { specName: 'test (jasmine)(worker)', runnerName: 'test', useWorkers: true, testRunner: 'jasmine' },
  { specName: 'it', runnerName: 'it', useWorkers: false, testRunner: undefined },
];
