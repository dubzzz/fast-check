import * as fc from 'fast-check';
import * as other from 'fast-check';

const left = fc.check(property);
console.log(left.failed);
const right = other.check(property);
console.log(right.failed);
