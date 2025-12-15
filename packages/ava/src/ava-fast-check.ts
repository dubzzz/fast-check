import type { AfterFn, BeforeFn, Implementation, ImplementationFn, TestFn, TryResult } from 'ava';
import test from 'ava';
import * as fc from 'fast-check';

export { fc, test };

type NonEmptyArray<A> = A[] & { 0: A };

type ArbitraryTuple<Ts extends NonEmptyArray<any>> = {
  [P in keyof Ts]: fc.Arbitrary<Ts[P]>;
};

type Prop<Context, Ts extends NonEmptyArray<any>> = ImplementationFn<Ts, Context>;

type PropertyTest<Context> = <Ts extends NonEmptyArray<any>>(
  label: string,
  arbitraries: ArbitraryTuple<Ts>,
  prop: Prop<Context, Ts>,
  params?: fc.Parameters<Ts>,
) => void;

type AvaModifierWhitelist = 'only' | 'failing' | 'skip' | 'serial';

export type PropertyTestFn<Context> = PropertyTest<Context> & {
  [Modifier in AvaModifierWhitelist]: PropertyTest<Context>;
} & {
  before: BeforeFn<Context>;
  after: AfterFn<Context>;
};

function wrapProp<Context, Ts extends NonEmptyArray<any>>(
  arbitraries: ArbitraryTuple<Ts>,
  prop: Prop<Context, Ts>,
  params?: fc.Parameters<Ts>,
): Implementation<Ts, Context> {
  return async (t, ..._args) => {
    let failingTry: undefined | TryResult;

    try {
      await fc.assert(
        fc.asyncProperty<unknown[], Ts>(
          ...(arbitraries as unknown[]),
          async (...args: Ts) => {
            const tryResult = await t.try((tt) => prop(tt, ...args));

            if (tryResult.passed) {
              tryResult.commit();
              return true;
            }

            const encounteredPreconditionFailure = tryResult.errors.some(
              (error) =>
                fc.PreconditionFailure.isFailure(error.savedError) || fc.PreconditionFailure.isFailure(error.cause),
            );
            if (encounteredPreconditionFailure) {
              tryResult.discard();
              fc.pre(false); // precondition failed
            }

            failingTry = tryResult;
            return false;
          },
        ),
        params,
      );
    } catch (error) {
      t.log((error as Error).message);
      (failingTry?.commit ?? t.fail)();
    }

    t.pass();
  };
}

function internalTestProp<Context, Ts extends NonEmptyArray<any>>(
  testFn: (label: string, exec: Implementation<Ts, Context>) => void,
  label: string,
  arbitraries: ArbitraryTuple<Ts>,
  prop: Prop<Context, Ts>,
  params?: fc.Parameters<Ts>,
): void {
  const customParams: fc.Parameters<Ts> = { ...params };
  if (customParams.seed === undefined) {
    const seedFromGlobals = fc.readConfigureGlobal().seed;
    if (seedFromGlobals !== undefined) {
      customParams.seed = seedFromGlobals;
    } else {
      customParams.seed = Date.now() ^ (Math.random() * 0x100000000);
    }
  }

  testFn(`${label} (with seed=${customParams.seed})`, wrapProp(arbitraries, prop, customParams));
}

function exposeModifier<Context, T extends Extract<keyof TestFn, AvaModifierWhitelist>>(
  modifier: T,
): PropertyTest<Context> {
  return (label, arbitraries, prop, params) =>
    internalTestProp((test as TestFn<Context>)[modifier], label, arbitraries, prop, params);
}

export const testProp: PropertyTestFn<unknown> = Object.assign(
  function testProp<Context, Ts extends NonEmptyArray<any>>(
    label: string,
    arbitraries: ArbitraryTuple<Ts>,
    prop: Prop<Context, Ts>,
    params?: fc.Parameters<Ts>,
  ): void {
    internalTestProp(test as TestFn<Context>, label, arbitraries, prop, params);
  },
  {
    only: exposeModifier('only'),
    failing: exposeModifier('failing'),
    skip: exposeModifier('skip'),
    serial: exposeModifier('serial'),
    before: test.before,
    after: test.after,
  },
);
