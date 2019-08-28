type MockedFunction<T> = T extends (...args: infer Args) => infer Result
  ? jest.Mock<Result, Args>
  : jest.Mock<any, any>;

type MockedModule<T> = { [K in keyof T]: MockedFunction<T[K]> };

export const mockModule = <T>(module: T): MockedModule<T> => module as any;
