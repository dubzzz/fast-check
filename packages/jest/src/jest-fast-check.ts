import * as fc from 'fast-check';

// TODO Import them directly
// Typings copied from the one of @types/jest
interface DoneCallback {
  (...args: any[]): any;
  fail(error?: string | { message: string }): any;
}
type ProvidesCallback = (cb: DoneCallback) => any;
interface It {
  (name: string, fn?: ProvidesCallback, timeout?: number): void;
  only: It;
  skip: It;
  todo: It;
}

declare const test: It;
declare const it: It;

// Pre-requisite: https://github.com/Microsoft/TypeScript/pull/26063
// Require TypeScript 3.1
type ArbitraryTuple<Ts extends [any] | any[]> = {
  [P in keyof Ts]: fc.Arbitrary<Ts[P]>;
};

type Prop<Ts extends [any] | any[]> = (...args: Ts) => boolean | void | PromiseLike<boolean | void>;
type PromiseProp<Ts extends [any] | any[]> = (...args: Ts) => Promise<boolean | void>;

function wrapProp<Ts extends [any] | any[]>(prop: Prop<Ts>): PromiseProp<Ts> {
  return (...args: Ts) => Promise.resolve(prop(...args));
}

function internalTestProp<Ts extends [any] | any[]>(
  testFn: It,
  label: string,
  arbitraries: ArbitraryTuple<Ts>,
  prop: Prop<Ts>,
  params?: fc.Parameters<Ts>
): void {
  const customParams: fc.Parameters<Ts> = params || {};
  if (customParams.seed === undefined) customParams.seed = Date.now();

  const promiseProp = wrapProp(prop);
  testFn(`${label} (with seed=${customParams.seed})`, async () => {
    await fc.assert((fc.asyncProperty as any)(...(arbitraries as any), promiseProp), params);
  });
}

export function testProp<Ts extends [any] | any[]>(
  label: string,
  arbitraries: ArbitraryTuple<Ts>,
  prop: Prop<Ts>,
  params?: fc.Parameters<Ts>
): void {
  internalTestProp(test, label, arbitraries, prop, params);
}

export namespace testProp {
  export const only = <Ts extends [any] | any[]>(
    label: string,
    arbitraries: ArbitraryTuple<Ts>,
    prop: Prop<Ts>,
    params?: fc.Parameters<Ts>
  ): void => internalTestProp(test.only, label, arbitraries, prop, params);
  export const skip = <Ts extends [any] | any[]>(
    label: string,
    arbitraries: ArbitraryTuple<Ts>,
    prop: Prop<Ts>,
    params?: fc.Parameters<Ts>
  ): void => internalTestProp(test.skip, label, arbitraries, prop, params);
  export const todo = <Ts extends [any] | any[]>(label: string, arbitraries?: ArbitraryTuple<Ts>): void =>
    test.todo(label);
}

export function itProp<Ts extends [any] | any[]>(
  label: string,
  arbitraries: ArbitraryTuple<Ts>,
  prop: Prop<Ts>,
  params?: fc.Parameters<Ts>
): void {
  internalTestProp(it, label, arbitraries, prop, params);
}

export namespace itProp {
  export const only = <Ts extends [any] | any[]>(
    label: string,
    arbitraries: ArbitraryTuple<Ts>,
    prop: Prop<Ts>,
    params?: fc.Parameters<Ts>
  ): void => internalTestProp(it.only, label, arbitraries, prop, params);
  export const skip = <Ts extends [any] | any[]>(
    label: string,
    arbitraries: ArbitraryTuple<Ts>,
    prop: Prop<Ts>,
    params?: fc.Parameters<Ts>
  ): void => internalTestProp(it.skip, label, arbitraries, prop, params);
  export const todo = <Ts extends [any] | any[]>(label: string, arbitraries?: ArbitraryTuple<Ts>): void =>
    it.todo(label);
}

export { fc };
