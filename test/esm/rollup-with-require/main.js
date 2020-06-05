// eslint-disable-next-line
const fc = require('fast-check');

// eslint-disable-next-line
console.log(fc.__type);
fc.assert(fc.property(fc.nat(), fc.nat(), (a, b) => a + b === b + a));
