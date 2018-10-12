const assert = require('assert');

const successCases = [
  { label: 'should be true when text starts with', text: 'hello world', pattern: 'he' },
  { label: 'should be true when pattern is somewhere inside', text: 'omg!!!', pattern: 'g' },
  { label: 'should be true when pattern is empty', text: 'whatever', pattern: '' }
];
const failureCases = [
  { label: 'should be false when there is no match', text: 'other', pattern: 'no' },
  { label: 'should be false when pattern is larger', text: '', pattern: 'no' }
];

const unit_tests = function(solver) {
  for (const t of successCases) it(t.label, () => assert.ok(solver(t.pattern, t.text)));
  for (const t of failureCases) it(t.label, () => assert.ok(!solver(t.pattern, t.text)));
};

module.exports = { unit_tests };
