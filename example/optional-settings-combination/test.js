const assert = require('assert');
const fc = require('fast-check');
const { createArray } = require('./createArray');

describe('createArray', () => {
    it('should always produce an array taking care of settings', () => fc.assert(
        fc.property(
            fc.record({
                minimum_size: fc.nat(100),
                maximum_size: fc.nat(100)
            }, {with_deleted_keys: true}),
            (settings) => {
                const out = createArray(() => 0, settings);
                if (settings.minimum_size != null)
                    assert.ok(out.length >= settings.minimum_size);
                if (settings.maximum_size != null)
                    assert.ok(out.length <= settings.maximum_size);
            })
    ));
});
