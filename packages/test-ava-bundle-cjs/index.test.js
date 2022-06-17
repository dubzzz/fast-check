// eslint-disable-next-line no-undef, @typescript-eslint/no-var-requires
const { testProp, fc } = require('@fast-check/ava');

// for all a, b, c strings
// b is a substring of a + b + c
testProp('should detect the substring', [fc.string(), fc.string(), fc.string()], (t, a, b, c) => {
  t.true((a + b + c).includes(b));
});
