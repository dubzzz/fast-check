const assert = require('assert');
const fc = require('fast-check');
const { contains } = require('./contains');

const successCases = [
    {label: 'should be true when text starts with', text: 'hello world', pattern: 'he'},
    {label: 'should be true when pattern is somewhere inside', text: 'omg!!!', pattern: 'g'},
    {label: 'should be true when pattern is empty', text: 'whatever', pattern: ''},
];
const failureCases = [
    {label: 'should be false when there is no match', text: 'other', pattern: 'no'},
    {label: 'should be false when pattern is larger', text: '', pattern: 'no'},
];

describe('contains', () => {
    // various unit-tests
    for (const t of successCases)
        it(t.label, () => assert.ok(contains(t.pattern, t.text)));
    for (const t of failureCases)
        it(t.label, () => assert.ok(! contains(t.pattern, t.text)));
    
    // properties
    it('should always contain b in a+b+c', () => fc.assert(
        fc.property(
            fc.string(), fc.string(), fc.string(),
            (a, b, c) => contains(b, a+b+c))
    ));
});
