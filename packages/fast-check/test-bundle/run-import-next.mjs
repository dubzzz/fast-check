import { strict as assert } from 'assert';
import * as main from 'fast-check';
import * as fc from 'fast-check/next';

const expected = { ...main, property: main.asyncProperty };
delete expected.default;
assert.deepEqual({ ...fc }, expected);
assert.equal(fc.property, fc.asyncProperty);
assert.notEqual(fc.property, main.property);
assert.equal(main.property(main.nat(), () => true).isAsync(), false);

const property = fc.property(fc.nat(), async (n) => n >= 0);
assert.equal(property.isAsync(), true);
const result = fc.assert(property);
assert.ok(result instanceof Promise);
await result;
await fc.assert(fc.property(fc.nat(), (n) => n >= 0));
await assert.rejects(fc.assert(fc.property(fc.nat(), async () => false)), /Property failed/);
