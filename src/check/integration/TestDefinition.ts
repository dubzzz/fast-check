export type TestDefinition<TestOutput> = (expectation: string, callback: () => PromiseLike<any>) => TestOutput;
