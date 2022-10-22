/* eslint-disable @typescript-eslint/ban-types */
import { expectType, expectTypeAssignable } from '../src/main';

function type<T>() {
  return null as any as T;
}

expectType<5>()(type<5>(), '5 is 5');
expectType<number>()(type<number>(), 'number is number');
expectType<never>()(type<never>(), 'never is never');
expectType<any>()(type<any>(), 'any is any');
expectType<unknown>()(type<unknown>(), 'unknown is unknown');
expectType<{ a: number }>()(type<{ a: number }>(), '{a:number} is {a:number}');
expectType<Promise<5>>()(type<Promise<5>>(), 'Promise<5> is Promise<5>');
expectType<[5]>()(type<[5]>(), '[5] is [5]');
expectType<[any]>()(type<[any]>(), '[any] is [any]');

// @ts-expect-error - 5 is not number
expectType<number>()(type<5>(), '5 is not number');
// @ts-expect-error - number is not 5
expectType<5>()(type<number>(), 'number is not 5');
// @ts-expect-error - number is not never
expectType<never>()(type<number>(), 'number is not never');
// @ts-expect-error - any is not never
expectType<never>()(type<any>(), 'any is not never');
// @ts-expect-error - unknown is not never
expectType<never>()(type<unknown>(), 'unknown is not never');
// @ts-expect-error - number is not any
expectType<any>()(type<number>(), 'number is not any');
// @ts-expect-error - never is not any
expectType<any>()(type<never>(), 'never is not any');
// @ts-expect-error - unknown is not any
expectType<any>()(type<unknown>(), 'unknown is not any');
// @ts-expect-error - number is not unknown
expectType<unknown>()(type<number>(), 'number is not unknown');
// @ts-expect-error - never is not unknown
expectType<unknown>()(type<never>(), 'never is not unknown');
// @ts-expect-error - any is not unknown
expectType<unknown>()(type<any>(), 'any is not unknown');
// @ts-expect-error - {a?:number} is not {a:number}
expectType<{ a: number }>()(type<{ a?: number }>(), '{a?:number} is not {a:number}');
// @ts-expect-error - {a:number} is not {a?:number}
expectType<{ a?: number }>()(type<{ a: number }>(), '{a:number} is not {a?:number}');
// @ts-expect-error - {a:number} is not {}
expectType<{}>()(type<{ a: number }>(), '{a:number} is not {}');
// @ts-expect-error - Promise<number> is not Promise<5>
expectType<Promise<5>>()(type<Promise<number>>(), 'Promise<number> is not Promise<5>');
// @ts-expect-error - Promise<5> is not Promise<number>
expectType<Promise<number>>()(type<Promise<5>>(), 'Promise<5> is not Promise<number>');
// @ts-expect-error - [15] is not [5]
expectType<[5]>()(type<[15]>(), '[15] is not [5]');
//// @ts-expect-error - [unknown] is not [any]
//expectType<[any]>()(type<[unknown]>(), '[unknown] is not [any]');
//// @ts-expect-error - [any] is not [unknown]
//expectType<[unknown]>()(type<[any]>(), '[any] is not [unknown]');

expectTypeAssignable<number>()(type<number>(), 'number is assignable to number');
expectTypeAssignable<number>()(type<5>(), '5 is assignable to number');
expectTypeAssignable<3 | 5>()(type<5>(), '5 is assignable to 3|5');
expectTypeAssignable<unknown>()(type<number>(), 'number is assignable to unknown');
expectTypeAssignable<any>()(type<number>(), 'number is assignable to any');
expectTypeAssignable<{ a?: number }>()(type<{ a: number }>(), '{a:number} is assignable to {a?:number}');
expectTypeAssignable<{}>()(type<{ a: number }>(), '{a:number} is assignable to {}');

// @ts-expect-error - number is not assignable to 5
expectTypeAssignable<5>()(type<number>(), 'number is not assignable to 5');
// @ts-expect-error - 3|5 is not assignable to 5
expectTypeAssignable<5>()(type<3 | 5>(), '3|5 is not assignable to 5');
// @ts-expect-error - {a?:number} is not assignable to {a:number}
expectTypeAssignable<{ a: number }>()(type<{ a?: number }>(), '{a?:number} is not assignable to {a:number}');
// @ts-expect-error - unknown is not assignable to number
expectTypeAssignable<number>()(type<unknown>(), 'unknown is not assignable to number');
// @ts-expect-error - unknown is not assignable to never
expectTypeAssignable<never>()(type<unknown>(), 'unknown is not assignable to never');
