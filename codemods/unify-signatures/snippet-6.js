import fc from 'fast-check';

fc.subarray([1, 2, 3, 4, 5], 0, 3); // can simplify minLength
fc.subarray([1, 2, 3, 4, 5], 1, 3); // nothing to simplify
fc.subarray([1, 2, 3, 4, 5], 1, 5); // can simplify maxLength
fc.subarray([1, 2, 3, 4, 5], 0, 5); // can simplify minLength and maxLength
fc.subarray(myArray, 0, 3); // can simplify minLength, maxLength status is unknown
