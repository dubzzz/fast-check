import * as fc from 'fast-check';
import { integer, assert as check } from 'fast-check';
check(fc.property(integer(), (n) => n === n));
