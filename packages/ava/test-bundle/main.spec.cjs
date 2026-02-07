const { testProp, fc } = require('@fast-check/ava');

testProp('should pass', [fc.constant(null)], (t, value) => {
  t.true(Object.is(value, null));
});
