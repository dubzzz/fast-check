import { testProp, fc } from '@fast-check/ava';

testProp('should pass', [fc.constant(null)], (t, value) => {
  t.true(Object.is(value, null));
});
