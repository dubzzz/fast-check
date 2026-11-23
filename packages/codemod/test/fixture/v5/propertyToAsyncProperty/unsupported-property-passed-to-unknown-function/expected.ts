import * as fc from 'fast-check';
import { assert } from 'another-lib';

const myProp = fc.property(fc.nat(), () => true);
assert(myProp);
