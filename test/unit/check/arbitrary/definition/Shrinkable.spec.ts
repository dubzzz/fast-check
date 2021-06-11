import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { cloneMethod, hasCloneMethod } from '../../../../../src/check/symbols';
import { Stream } from '../../../../../src/stream/Stream';

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
      },
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
      },
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
      },
    };
    const s = new Shrinkable(cloneable);
    expect(s.value_).toBe(cloneable);
    expect(numCalls).toEqual(0);
  });
  it('Should produce mapped values with [cloneMethod] if value was cloneable', () => {
    const cloneMethodImplem = jest.fn();
    const cloneable = { [cloneMethod]: cloneMethodImplem };
    const s = new Shrinkable(cloneable);
    const mapped = s.map(() => []);
    expect(mapped.hasToBeCloned).toBe(true);
    expect(hasCloneMethod(mapped.value_)).toBe(true);
    expect(cloneMethodImplem).not.toHaveBeenCalled();
  });
  it('Should produce mapped values with [cloneMethod] returning a clone with [cloneMethod] too', () => {
    const cloneMethodImplem = jest.fn();
    const cloneable = { [cloneMethod]: cloneMethodImplem };
    const s = new Shrinkable(cloneable);
    const mapped = s.map(() => []);
    const access1 = mapped.value;
    const access2 = mapped.value;
    const access3 = (access1 as any)[cloneMethod]();
    expect(access2).not.toBe(access1);
    expect(access3).not.toBe(access1);
    expect(hasCloneMethod(access1)).toBe(true);
    expect(hasCloneMethod(access2)).toBe(true);
    expect(hasCloneMethod(access3)).toBe(true);
    expect(cloneMethodImplem).toHaveBeenCalledTimes(2);
  });
  it('Should produce shrunk mapped values with [cloneMethod] if value was cloneable', () => {
    const cloneMethodImplem = jest.fn();
    const cloneable = { [cloneMethod]: cloneMethodImplem };
    const s = new Shrinkable(cloneable, () => Stream.of(new Shrinkable(cloneable)));
    const mapped = s.map(() => []);
    const shrunkMapped = mapped.shrink().getNthOrLast(0)!;
    expect(shrunkMapped.hasToBeCloned).toBe(true);
    expect(hasCloneMethod(shrunkMapped.value_)).toBe(true);
    expect(cloneMethodImplem).not.toHaveBeenCalled();
  });
  it('Should produce filtered values with [cloneMethod] if value was cloneable', () => {
    const cloneMethodImplem = jest.fn();
    const cloneable = { [cloneMethod]: cloneMethodImplem };
    const s = new Shrinkable(cloneable);
    const filtered = s.filter(() => true);
    expect(filtered.hasToBeCloned).toBe(true);
    expect(hasCloneMethod(filtered.value_)).toBe(true);
    expect(cloneMethodImplem).not.toHaveBeenCalled();
  });
  it('Should produce filtered values with [cloneMethod] returning a clone with [cloneMethod] too', () => {
    const cloneMethodImplem = jest.fn();
    const cloneable = { [cloneMethod]: cloneMethodImplem };
    cloneMethodImplem.mockReturnValue({ [cloneMethod]: cloneMethodImplem });
    const s = new Shrinkable(cloneable);
    const filtered = s.filter(() => true);
    const access1 = filtered.value;
    const access2 = filtered.value;
    const access3 = (access1 as any)[cloneMethod]();
    expect(access2).not.toBe(access1);
    expect(access3).not.toBe(access1);
    expect(hasCloneMethod(access1)).toBe(true);
    expect(hasCloneMethod(access2)).toBe(true);
    expect(hasCloneMethod(access3)).toBe(true);
    expect(cloneMethodImplem).toHaveBeenCalledTimes(2);
  });
  it('Should produce shrunk filtered values with [cloneMethod] if value was cloneable', () => {
    const cloneMethodImplem = jest.fn();
    const cloneable = { [cloneMethod]: cloneMethodImplem };
    const s = new Shrinkable(cloneable, () => Stream.of(new Shrinkable(cloneable)));
    const mapped = s.filter(() => true);
    const shrunkFiltered = mapped.shrink().getNthOrLast(0)!;
    expect(shrunkFiltered.hasToBeCloned).toBe(true);
    expect(hasCloneMethod(shrunkFiltered.value_)).toBe(true);
    expect(cloneMethodImplem).not.toHaveBeenCalled();
  });
});
