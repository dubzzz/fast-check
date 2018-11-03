import * as assert from 'assert';
import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { cloneMethod } from '../../../../../src/check/symbols';

describe('Shrinkable', () => {
  it('Should detect absence of [cloneMethod] method', () => {
    const notCloneable = {};
    const s = new Shrinkable(notCloneable);
    assert.ok(!s.hasToBeCloned);
  });
  it('Should detect [cloneMethod] method', () => {
    const cloneable = { [cloneMethod]: () => cloneable };
    const s = new Shrinkable(cloneable);
    assert.ok(s.hasToBeCloned);
  });
  it('Should not call [cloneMethod] on instantiation', () => {
    let numCalls = 0;
    const cloneable = {
      [cloneMethod]: () => {
        ++numCalls;
        return cloneable;
      }
    };
    new Shrinkable(cloneable);
    assert.equal(numCalls, 0);
  });
  it('Should call [cloneMethod] on value accessor', () => {
    let numCalls = 0;
    const theClone = {};
    const cloneable = {
      [cloneMethod]: () => {
        ++numCalls;
        return theClone;
      }
    };
    const s = new Shrinkable(cloneable);
    assert.ok(s.value === theClone);
    assert.equal(numCalls, 1);
  });
  it('Should not call [cloneMethod] on value accessor', () => {
    let numCalls = 0;
    const theClone = {};
    const cloneable = {
      [cloneMethod]: () => {
        ++numCalls;
        return theClone;
      }
    };
    const s = new Shrinkable(cloneable);
    assert.ok(s.value_ === cloneable);
    assert.equal(numCalls, 0);
  });
});
