const { testProp, fc } = require('ava-fast-check');

// for all a, b, c strings
// b is a substring of a + b + c
testProp('should detect the substring', [fc.string(), fc.string(), fc.string()], (t, a, b, c) => {
  t.true((a + b + c).includes(b));
});
