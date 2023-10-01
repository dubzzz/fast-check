import { expectType, expectTypeAssignable } from '@fast-check/expect-type';

expectType<string>()(''.toLowerCase(), 'toLowerCase outputs a string');
expectTypeAssignable<string | number>()(''.toLowerCase(), 'toLowerCase outputs a type is assignable to string|number');
