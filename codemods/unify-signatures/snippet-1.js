const fc = require('fast-check');

/* array */
// with minLength only
fc.array(fc.nat(), 10);
// with minLength and maxLength
fc.array(fc.nat(), 0, 10);
// with nested arrays
fc.array(fc.array(fc.nat(), 0, 10), 3, 48);
// with chain
fc.nat(100).chain((n) => fc.array(fc.nat(), n));
// already converted
fc.array(fc.nat(), { minLength: 10 });
