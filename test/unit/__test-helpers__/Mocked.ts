// Copied from ts-jest/dist/utils/testing

type MockableFunction = (...args: any[]) => any;
type ArgumentsOf<T> = T extends (...args: infer A) => any ? A : never;
type ConstructorArgumentsOf<T> = T extends new (...args: infer A) => any ? A : never;

export interface MockWithArgs<T extends MockableFunction> extends jest.MockInstance<ReturnType<T>, ArgumentsOf<T>> {
  new (...args: ConstructorArgumentsOf<T>): T;
  (...args: ArgumentsOf<T>): ReturnType<T>;
}

type MethodKeysOf<T> = {
  [K in keyof T]: T[K] extends MockableFunction ? K : never;
}[keyof T];
type PropertyKeysOf<T> = {
  [K in keyof T]: T[K] extends MockableFunction ? never : K;
}[keyof T];
type MaybeMockedConstructor<T> = T extends new (...args: any[]) => infer R
  ? jest.MockInstance<R, ConstructorArgumentsOf<T>>
  : T;
type MockedFunction<T extends MockableFunction> = MockWithArgs<T> & {
  [K in keyof T]: T[K];
};
type MockedObject<T> = MaybeMockedConstructor<T> & {
  [K in MethodKeysOf<T>]: T[K] extends MockableFunction ? MockedFunction<T[K]> : T[K];
} & {
  [K in PropertyKeysOf<T>]: T[K];
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type MaybeMocked<T> = T extends MockableFunction ? MockedFunction<T> : T extends object ? MockedObject<T> : T;

export function mocked<T>(item: T): MaybeMocked<T> {
  return item as MaybeMocked<T>;
}
