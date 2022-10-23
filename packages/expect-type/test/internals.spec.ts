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
export const Test_IsSame_true_false: IsSame<true, false> = false;
export const Test_IsSame_true_boolean: IsSame<true, boolean> = false;
export const Test_IsSame_never_boolean: IsSame<never, boolean> = false;
export const Test_IsSame_never_any: IsSame<never, any> = false;
export const Test_IsSame_never_unknown: IsSame<never, unknown> = false;
export const Test_IsSame_never_never: IsSame<never, never> = true;
export const Test_IsSame_any_boolean: IsSame<any, boolean> = false;
export const Test_IsSame_any_any: IsSame<any, any> = true;
export const Test_IsSame_any_any_Bis: IsSame<IsSame<any, any>, true> = true;
export const Test_IsSame_any_unknown: IsSame<any, unknown> = false;
export const Test_IsSame_any_never: IsSame<any, never> = false;
export const Test_IsSame_unknown_boolean: IsSame<unknown, boolean> = false;
export const Test_IsSame_unknown_any: IsSame<unknown, any> = false;
export const Test_IsSame_unknown_unknown: IsSame<unknown, unknown> = true;
export const Test_IsSame_unknown_never: IsSame<unknown, never> = false;
export const Test_IsSame_tuple_number_tuple_string: IsSame<[number], [string]> = false;
//export const Test_IsSame_tuple_any_tuple_unknown: IsSame<[any], [unknown]> = false;
