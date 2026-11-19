import { integer, default as fc, assert as check } from 'fast-check';
check(fc.property(integer(), (n) => n === n));
