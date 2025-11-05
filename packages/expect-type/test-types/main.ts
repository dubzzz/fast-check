import { expectTypeOf } from 'vitest';

expectTypeOf(''.toLowerCase()).toEqualTypeOf<string>(); // toLowerCase outputs a string
expectTypeOf(''.toLowerCase()).toMatchTypeOf<string | number>(); // toLowerCase outputs a type is assignable to string|number
