import fc from 'fast-check';
fc.assert(fc.property(fc.integer(), (n) => n === n));
