/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */

type Not<T> = T extends true ? false : true;
const Test_Not_true: Not<true> = false;
const Test_Not_false: Not<false> = true;

type And<T, U> = T extends true ? (U extends true ? true : false) : false;
const Test_And_false_false: And<false, false> = false;
const Test_And_false_true: And<false, true> = false;
const Test_And_true_false: And<true, false> = false;
const Test_And_true_true: And<true, true> = true;

type Or<T, U> = T extends false ? (U extends false ? false : true) : true;
const Test_Or_false_false: Or<false, false> = false;
const Test_Or_false_true: Or<false, true> = true;
const Test_Or_true_false: Or<true, false> = true;
const Test_Or_true_true: Or<true, true> = true;

type IsNever<T> = [T] extends [never] ? true : false;
const Test_IsNever_null: IsNever<null> = false;
const Test_IsNever_undefined: IsNever<undefined> = false;
const Test_IsNever_number: IsNever<number> = false;
const Test_IsNever_any: IsNever<any> = false;
const Test_IsNever_unknown: IsNever<unknown> = false;
const Test_IsNever_never: IsNever<never> = true;

type Extends<T, U> = T extends U ? true : false;
type ExtendsString<T> = Extends<T, string> extends boolean
  ? boolean extends Extends<T, string>
    ? true
    : false
  : false; // Extends<T, string> is: false for unknown but boolean for any

type IsUnknown<T> = And<And<Not<IsNever<T>>, Extends<T, unknown>>, And<Extends<unknown, T>, Not<ExtendsString<T>>>>;

const Test_IsUnknown_null: IsUnknown<null> = false;
const Test_IsUnknown_undefined: IsUnknown<undefined> = false;
const Test_IsUnknown_number: IsUnknown<number> = false;
const Test_IsUnknown_any: IsUnknown<any> = false;
const Test_IsUnknown_unknown: IsUnknown<unknown> = true;
const Test_IsUnknown_never: IsUnknown<never> = false;

type IsAny<T> = And<
  And<Not<IsNever<T>>, Not<IsUnknown<T>>>,
  And<Extends<T, any>, Extends<any, T> extends true ? true : false>
>;
const Test_IsAny_null: IsAny<null> = false;
const Test_IsAny_undefined: IsAny<undefined> = false;
const Test_IsAny_number: IsAny<number> = false;
const Test_IsAny_any: IsAny<any> = true;
const Test_IsAny_unknown: IsAny<unknown> = false;
const Test_IsAny_never: IsAny<never> = false;

type IsSame<T, U> = [T, U] extends [U, T]
  ? Or<
      Or<And<IsAny<T>, IsAny<U>>, And<IsUnknown<T>, IsUnknown<U>>>,
      And<And<Not<IsAny<T>>, Not<IsAny<U>>>, And<Not<IsUnknown<T>>, Not<IsUnknown<U>>>>
    >
  : false;
const Test_IsSame_true_true: IsSame<true, true> = true;
const Test_IsSame_true_false: IsSame<true, false> = false;
const Test_IsSame_true_boolean: IsSame<true, boolean> = false;
const Test_IsSame_never_boolean: IsSame<never, boolean> = false;
const Test_IsSame_never_any: IsSame<never, any> = false;
const Test_IsSame_never_unknown: IsSame<never, unknown> = false;
const Test_IsSame_never_never: IsSame<never, never> = true;
const Test_IsSame_any_boolean: IsSame<any, boolean> = false;
const Test_IsSame_any_any: IsSame<any, any> = true;
const Test_IsSame_any_any_Bis: IsSame<IsSame<any, any>, true> = true;
const Test_IsSame_any_unknown: IsSame<any, unknown> = false;
const Test_IsSame_any_never: IsSame<any, never> = false;
const Test_IsSame_unknown_boolean: IsSame<unknown, boolean> = false;
const Test_IsSame_unknown_any: IsSame<unknown, any> = false;
const Test_IsSame_unknown_unknown: IsSame<unknown, unknown> = true;
const Test_IsSame_unknown_never: IsSame<unknown, never> = false;

export function expectType<TExpectedType>() {
  return function <TReal>(
    arg: TReal,
    ...noArgs: IsSame<TExpectedType, TReal> extends true ? [] : [{ expected: TExpectedType; got: TReal }]
  ) {
    // no code
  };
}

function type<T>() {
  return (null as any) as T;
}

expectType<5>()(type<5>());
expectType<number>()(type<number>());
expectType<never>()(type<never>());
expectType<any>()(type<any>());
expectType<unknown>()(type<unknown>());
expectType<{ a: number }>()(type<{ a: number }>());
expectType<Promise<5>>()(type<Promise<5>>());
expectType<[5]>()(type<[5]>());
expectType<[any]>()(type<[any]>());

// @ts-expect-error
expectType<number>()(type<5>());
// @ts-expect-error
expectType<5>()(type<number>());
// @ts-expect-error
expectType<never>()(type<number>());
// @ts-expect-error
expectType<never>()(type<any>());
// @ts-expect-error
expectType<never>()(type<unknown>());
// @ts-expect-error
expectType<any>()(type<number>());
// @ts-expect-error
expectType<any>()(type<never>());
// @ts-expect-error
expectType<any>()(type<unknown>());
// @ts-expect-error
expectType<unknown>()(type<number>());
// @ts-expect-error
expectType<unknown>()(type<never>());
// @ts-expect-error
expectType<unknown>()(type<any>());
// @ts-expect-error
expectType<{ a: number }>()(type<{ a?: number }>());
// @ts-expect-error
expectType<{ a?: number }>()(type<{ a: number }>());
// @ts-expect-error
expectType<{}>()(type<{ a: number }>());
// @ts-expect-error
expectType<Promise<5>>()(type<Promise<number>>());
// @ts-expect-error
expectType<Promise<number>>()(type<Promise<5>>());
// @ts-expect-error
expectType<[5]>()(type<[15]>());
// @ts-expect-error
expectType<[any]>()(type<[unknown]>());
// @ts-expect-error
expectType<[unknown]>()(type<[any]>());

export function expectTypeAssignable<TExpectedType>() {
  return function <TReal>(
    arg: TReal,
    ...noArgs: Extends<TReal, TExpectedType> extends true ? [] : [{ expected: TExpectedType; got: TReal }]
  ) {
    // no code
  };
}

expectTypeAssignable<number>()(type<number>());
expectTypeAssignable<number>()(type<5>());
expectTypeAssignable<3 | 5>()(type<5>());
expectTypeAssignable<unknown>()(type<number>());
expectTypeAssignable<any>()(type<number>());
expectTypeAssignable<{ a?: number }>()(type<{ a: number }>());
expectTypeAssignable<{}>()(type<{ a: number }>());

// @ts-expect-error
expectTypeAssignable<5>()(type<number>());
// @ts-expect-error
expectTypeAssignable<5>()(type<3 | 5>());
// @ts-expect-error
expectTypeAssignable<{ a: number }>()(type<{ a?: number }>());
// @ts-expect-error
expectTypeAssignable<number>()(type<unknown>());
// @ts-expect-error
expectTypeAssignable<never>()(type<unknown>());
