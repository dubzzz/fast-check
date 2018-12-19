import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { cloneMethod } from '../../../../../src/check/symbols';

describe('Shrinkable', () => {
  it('Should detect absence of [cloneMethod] method', () => {
    const notCloneable = {};
    const s = new Shrinkable(notCloneable);
    expect(s.hasToBeCloned).toBe(false);
  });
  it('Should detect [cloneMethod] method', () => {
    const cloneable = { [cloneMethod]: () => cloneable };
    const s = new Shrinkable(cloneable);
    expect(s.hasToBeCloned).toBe(true);
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
    expect(numCalls).toEqual(0);
  });
  it('Should call [cloneMethod] on second call to value accessor', () => {
    let numCalls = 0;
    const theClone = {};
    const cloneable = {
      [cloneMethod]: () => {
        ++numCalls;
        return theClone;
      }
    };
    const s = new Shrinkable(cloneable);
    expect(s.value).toBe(cloneable);
    expect(numCalls).toEqual(0);
    expect(s.value).toBe(theClone);
    expect(numCalls).toEqual(1);
  });
  it('Should not call [cloneMethod] on (drity) value_ accessor', () => {
    let numCalls = 0;
    const theClone = {};
    const cloneable = {
      [cloneMethod]: () => {
        ++numCalls;
        return theClone;
      }
    };
    const s = new Shrinkable(cloneable);
    expect(s.value_).toBe(cloneable);
    expect(numCalls).toEqual(0);
  });
});
