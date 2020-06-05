import { makeLazy } from '../../../src/stream/LazyIterableIterator';

describe('makeLazy', () => {
  it('Should not call producer on create', () => {
    const g = jest.fn();

    makeLazy(g);
    expect(g).not.toHaveBeenCalled();
  });
  it('Should only call producer once when iterating', () => {
    const content = [1, 42, 350, 0];
    const g = jest.fn().mockImplementation(function* () {
      yield* content;
    });

    const s = makeLazy(g);
    expect([...s]).toEqual(content);
    expect(g).toHaveBeenCalledTimes(1);
  });
  it('Should only call producer once even when iterating twice', () => {
    const content = [1, 42, 350, 0];
    const g = jest.fn().mockImplementation(function* () {
      yield* content;
    });

    const s = makeLazy(g);
    expect([...s]).toEqual(content);
    expect([...s]).toEqual([]);
    expect(g).toHaveBeenCalledTimes(1);
  });
});
