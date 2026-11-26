import * as fc from 'fast-check';

const checkProperty = 'reserved';
const checkParams = 'reserved';
const checkDetails = 'reserved';
const checkExecution = 'reserved';
console.log(checkProperty, checkParams, checkDetails, checkExecution);
const property = fc.property(fc.nat(), (n) => n < 100);
const { failed } = fc.check(property, { seed: 42 });
console.log(failed);
