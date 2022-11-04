import { Not, And, Or, IsNever, IsUnknown, IsAny, IsSame } from '../src/internals';

export const Test_Not_true: Not<true> = false;
export const Test_Not_false: Not<false> = true;

export const Test_And_false_false: And<false, false> = false;
export const Test_And_false_true: And<false, true> = false;
export const Test_And_true_false: And<true, false> = false;
export const Test_And_true_true: And<true, true> = true;

export const Test_Or_false_false: Or<false, false> = false;
export const Test_Or_false_true: Or<false, true> = true;
export const Test_Or_true_false: Or<true, false> = true;
export const Test_Or_true_true: Or<true, true> = true;

export const Test_IsNever_null: IsNever<null> = false;
export const Test_IsNever_undefined: IsNever<undefined> = false;
export const Test_IsNever_number: IsNever<number> = false;
export const Test_IsNever_any: IsNever<any> = false;
export const Test_IsNever_unknown: IsNever<unknown> = false;
export const Test_IsNever_never: IsNever<never> = true;

export const Test_IsUnknown_null: IsUnknown<null> = false;
export const Test_IsUnknown_undefined: IsUnknown<undefined> = false;
export const Test_IsUnknown_number: IsUnknown<number> = false;
export const Test_IsUnknown_any: IsUnknown<any> = false;
export const Test_IsUnknown_unknown: IsUnknown<unknown> = true;
export const Test_IsUnknown_never: IsUnknown<never> = false;

export const Test_IsAny_null: IsAny<null> = false;
export const Test_IsAny_undefined: IsAny<undefined> = false;
export const Test_IsAny_number: IsAny<number> = false;
export const Test_IsAny_any: IsAny<any> = true;
export const Test_IsAny_unknown: IsAny<unknown> = false;
export const Test_IsAny_never: IsAny<never> = false;

export const Test_IsSame_true_true: IsSame<true, true> = true;
export const Test_IsSame_tuple_true_tuple_true: IsSame<[true], [true]> = true;
export const Test_IsSame_return_true_return_true: IsSame<() => true, () => true> = true;
export const Test_IsSame_take_true_take_true: IsSame<(v: true) => void, (v: true) => void> = true;
export const Test_IsSame_true_false: IsSame<true, false> = false;
export const Test_IsSame_return_true_return_false: IsSame<() => true, () => false> = false;
export const Test_IsSame_take_true_take_false: IsSame<(v: true) => void, (v: false) => void> = false;
export const Test_IsSame_take_true_take_true_and_false: IsSame<(v: true) => void, (v: true, u: false) => void> = false;
// @ts-expect-error - Variadic arguments are somehow ignored at the moment
export const Test_IsSame_take_1_take_1_and_others: IsSame<(v: 1) => 0, (v: 1, ...u: unknown[]) => 0> = false;
export const Test_IsSame_true_boolean: IsSame<true, boolean> = false;
export const Test_IsSame_never_boolean: IsSame<never, boolean> = false;
export const Test_IsSame_never_any: IsSame<never, any> = false;
export const Test_IsSame_never_unknown: IsSame<never, unknown> = false;
export const Test_IsSame_never_never: IsSame<never, never> = true;
export const Test_IsSame_tuple_never_tuple_never: IsSame<[never], [never]> = true;
export const Test_IsSame_any_boolean: IsSame<any, boolean> = false;
export const Test_IsSame_any_any: IsSame<any, any> = true;
export const Test_IsSame_any_any_Bis: IsSame<IsSame<any, any>, true> = true;
export const Test_IsSame_tuple_any_tuple_any: IsSame<[any], [any]> = true;
export const Test_IsSame_set_any_set_any: IsSame<Set<any>, Set<any>> = true;
export const Test_IsSame_any_tuple_any: IsSame<any, [any]> = false;
export const Test_IsSame_tuple_any_any: IsSame<[any], any> = false;
export const Test_IsSame_any_unknown: IsSame<any, unknown> = false;
export const Test_IsSame_any_never: IsSame<any, never> = false;
export const Test_IsSame_unknown_boolean: IsSame<unknown, boolean> = false;
export const Test_IsSame_unknown_any: IsSame<unknown, any> = false;
export const Test_IsSame_unknown_unknown: IsSame<unknown, unknown> = true;
export const Test_IsSame_tuple_unknown_tuple_unknown: IsSame<[unknown], [unknown]> = true;
export const Test_IsSame_set_unknown_set_unknown: IsSame<Set<unknown>, Set<unknown>> = true;
export const Test_IsSame_unknown_never: IsSame<unknown, never> = false;
export const Test_IsSame_set_unknown_set_number: IsSame<Set<unknown>, Set<number>> = false;
export const Test_IsSame_tuple_number_tuple_string: IsSame<[number], [string]> = false;
export const Test_IsSame_tuple_any_tuple_unknown: IsSame<[any], [unknown]> = false;
export const Test_IsSame_tuple_unknown_tuple_any: IsSame<[unknown], [any]> = false;
export const Test_IsSame_tuple_2_any_tuple_2_unknown: IsSame<[any, any], [unknown, unknown]> = false;
export const Test_IsSame_deep_tuple_any_deep_tuple_unknown: IsSame<[[any]], [[unknown]]> = false;
export const Test_IsSame_object_any_object_unknown: IsSame<{ a: any }, { a: unknown }> = false;
export const Test_IsSame_object_any_partial_object_unknown: IsSame<{ a: any }, { a?: unknown }> = false;
// @ts-expect-error - Set<any> is assignable to Set<unknown> and vice-versa and deep equality fails for <any>
export const Test_IsSame_set_any_set_unknown: IsSame<Set<any>, Set<unknown>> = false;

type Tree<T> = { value: T } | { left: Tree<T>; right: Tree<T> };
export const Test_IsSame_tree_number_tree_number: IsSame<Tree<number>, Tree<number>> = true;
export const Test_IsSame_tree_tuple_number_tree_tuple_number: IsSame<Tree<[number]>, Tree<[number]>> = true;
export const Test_IsSame_tree_never_tree_never: IsSame<Tree<never>, Tree<never>> = true;
export const Test_IsSame_tree_tuple_never_tree_tuple_never: IsSame<Tree<[never]>, Tree<[never]>> = true;
export const Test_IsSame_tree_any_tree_any: IsSame<Tree<any>, Tree<any>> = true;
export const Test_IsSame_tree_tuple_any_tree_tuple_any: IsSame<Tree<[any]>, Tree<[any]>> = true;
export const Test_IsSame_tree_unknown_tree_unknown: IsSame<Tree<unknown>, Tree<unknown>> = true;
export const Test_IsSame_tree_tuple_unknown_tree_tuple_unknown: IsSame<Tree<[unknown]>, Tree<[unknown]>> = true;
export const Test_IsSame_tree_number_tree_string: IsSame<Tree<number>, Tree<string>> = false;
export const Test_IsSame_tree_number_tree_unknown: IsSame<Tree<number>, Tree<unknown>> = false;
// @ts-expect-error - Tree<any> is assignable to Tree<number> and vice-versa and deep equality fails for <any>
export const Test_IsSame_tree_number_tree_any: IsSame<Tree<number>, Tree<any>> = false;
// @ts-expect-error - Tree<any> is assignable to Tree<unknown> and vice-versa and deep equality fails for <any>
export const Test_IsSame_tree_unknown_tree_any: IsSame<Tree<unknown>, Tree<any>> = false;
// @ts-expect-error - Tree<any> is assignable to Tree<unknown> and vice-versa and deep equality fails for <any>
export const Test_IsSame_tree_any_tree_unknown: IsSame<Tree<any>, Tree<unknown>> = false;
