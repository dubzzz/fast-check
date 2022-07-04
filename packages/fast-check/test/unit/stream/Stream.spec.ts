import { Stream, stream } from '../../../src/stream/Stream';

describe('Stream', () => {
  describe('constructor', () => {
    it('Should have the same values as its underlying', () => {
      function* g() {
        yield* [1, 42, 350, 0];
      }
      const s = stream(g());
      expect([...s]).toEqual([1, 42, 350, 0]);
    });
    it('Should not be able to iterate twice', () => {
      function* g() {
        yield* [1, 42, 350, 0];
      }
      const s = stream(g());
      expect([...s]).toEqual([1, 42, 350, 0]);
      expect([...s]).toEqual([]);
    });
    it('Should handle infinite generators', () => {
      function* g() {
        let idx = 0;
        while (true) {
          yield ++idx;
        }
      }
      const s = stream(g());
      const data = [];
      for (let idx = 0; idx !== 5; ++idx) {
        data.push(s.next().value);
      }
      expect(data).toEqual([1, 2, 3, 4, 5]);
    });
  });
  describe('nil', () => {
    it('Should instantiate an empty stream', () => {
      const s: Stream<number> = Stream.nil<number>();
      expect([...s]).toEqual([]);
    });
  });
  describe('of', () => {
    it('Should instantiate an empty stream given no elements', () => {
      const s: Stream<number> = Stream.of();
      expect([...s]).toEqual([]);
    });
    it('Should instantiate a stream containing a single entry given a single element', () => {
      const s: Stream<number> = Stream.of(1);
      expect([...s]).toEqual([1]);
    });
    it('Should instantiate a stream containing the same entries as passed elements with same ordering', () => {
      const s: Stream<number> = Stream.of(1, 42, 69);
      expect([...s]).toEqual([1, 42, 69]);
    });
    it('Should not consider elements of type Array differently from other ones', () => {
      const s: Stream<number[]> = Stream.of([1, 42, 69]);
      expect([...s]).toEqual([[1, 42, 69]]);
    });
  });
  describe('map', () => {
    it('Should apply on each element', () => {
      function* g() {
        yield* [1, 2, 3, 5];
      }
      const s = stream(g()).map((v) => v * v);
      expect([...s]).toEqual([1, 4, 9, 25]);
    });
    it('Should be able to perform conversions', () => {
      function* g() {
        yield* [1, 2, 3, 5];
      }
      const s: Stream<string> = stream(g()).map((v) => String(v));
      expect([...s]).toEqual(['1', '2', '3', '5']);
    });
  });
  describe('flatMap', () => {
    it('Should apply on each element', () => {
      function* g() {
        yield* [1, 2, 3, 5];
      }
      function* expand(n: number) {
        for (let idx = 0; idx !== n; ++idx) {
          yield n;
        }
      }
      const s = stream(g()).flatMap(expand);
      expect([...s]).toEqual([1, 2, 2, 3, 3, 3, 5, 5, 5, 5, 5]);
    });
    it('Should handle correctly empty iterables', () => {
      function* g() {
        yield* [1, 2, 3, 0, 5];
      }
      function* noexpand(n: number) {
        if (n >= 3) {
          yield n;
        }
      }
      const s = stream(g()).flatMap(noexpand);
      expect([...s]).toEqual([3, 5]);
    });
  });
  describe('drop', () => {
    it('Should drop the right number of elements', () => {
      function* g() {
        yield* [1, 2, 3, 4, 5, 6];
      }
      const s = stream(g()).drop(2);
      expect([...s]).toEqual([3, 4, 5, 6]);
    });
  });
  describe('dropWhile', () => {
    it('Should drop while predicate stays valid', () => {
      function* g() {
        yield* [-4, -2, -3, 1, -8, 7];
      }
      const s = stream(g()).dropWhile((v) => v < 0);
      expect([...s]).toEqual([1, -8, 7]);
    });
    it('Should drop everything', () => {
      function* g() {
        yield* [-4, -2, -3, 1, -8, 7];
      }
      const s = stream(g()).dropWhile((_) => true);
      expect([...s]).toEqual([]);
    });
    it('Should drop nothing', () => {
      function* g() {
        yield* [-4, -2, -3, 1, -8, 7];
      }
      const s = stream(g()).dropWhile((_) => false);
      expect([...s]).toEqual([-4, -2, -3, 1, -8, 7]);
    });
  });
  describe('take', () => {
    it('Should take the right number of elements', () => {
      function* g() {
        yield* [1, 2, 3, 4, 5, 6];
      }
      const s = stream(g()).take(4);
      expect([...s]).toEqual([1, 2, 3, 4]);
    });
    it('Should accept stream containing less values than the requested number', () => {
      function* g() {
        yield* [1, 2];
      }
      const s = stream(g()).take(4);
      expect([...s]).toEqual([1, 2]);
    });
    it('Should only pull the requested number of items not more', () => {
      let numValues = 0;
      function* g() {
        while (true) {
          ++numValues;
          yield 0;
        }
      }
      const s = stream(g()).take(4);
      expect([...s]).toEqual([0, 0, 0, 0]);
      expect(numValues).toBe(4);
    });
  });
  describe('takeWhile', () => {
    it('Should take while predicate stays valid', () => {
      function* g() {
        yield* [-4, -2, -3, 1, -8, 7];
      }
      const s = stream(g()).takeWhile((v) => v < 0);
      expect([...s]).toEqual([-4, -2, -3]);
    });
    it('Should take everything', () => {
      function* g() {
        yield* [-4, -2, -3, 1, -8, 7];
      }
      const s = stream(g()).takeWhile((_) => true);
      expect([...s]).toEqual([-4, -2, -3, 1, -8, 7]);
    });
    it('Should take nothing', () => {
      function* g() {
        yield* [-4, -2, -3, 1, -8, 7];
      }
      const s = stream(g()).takeWhile((_) => false);
      expect([...s]).toEqual([]);
    });
  });
  describe('filter', () => {
    it('Should remove undesirable values', () => {
      function* g() {
        yield* [1, 3, 4, 7, 8, 10, 1, 1, 3, 4, 4];
      }
      const s = stream(g()).filter((v) => v % 2 === 0);
      expect([...s]).toEqual([4, 8, 10, 4, 4]);
    });
  });
  describe('every', () => {
    it('Should be true if all values are ok', () => {
      function* g() {
        yield* [1, 3, 4, 7, 8, 10, 1, 1, 3, 4, 4];
      }
      expect(stream(g()).every((v) => v > 0)).toBe(true);
    });
    it('Should be true for empty streams', () => {
      function* g() {
        yield* [];
      }
      expect(stream(g()).every((v) => v > 0)).toBe(true);
    });
    it('Should be false if it starts by a failing value', () => {
      function* g() {
        yield* [0, 1, 3, 4, 7, 8, 10, 1, 1, 3, 4, 4];
      }
      expect(stream(g()).every((v) => v > 0)).toBe(false);
    });
    it('Should be false if it ends by a failing value', () => {
      function* g() {
        yield* [1, 3, 4, 7, 8, 10, 1, 1, 3, 4, 4, 0];
      }
      expect(stream(g()).every((v) => v > 0)).toBe(false);
    });
    it('Should be false if it contains a failing value', () => {
      function* g() {
        yield* [1, 3, 4, 7, 8, 10, 0, 1, 1, 3, 4, 4];
      }
      expect(stream(g()).every((v) => v > 0)).toBe(false);
    });
  });
  describe('has', () => {
    it('Should be true if one of the values is ok', () => {
      function* g() {
        yield* [1, 3, 4, 7, 8, 10, 1, 1, 3, 4, 4];
      }
      expect(stream(g()).has((v) => v > 9)).toEqual([true, 10]);
    });
    it('Should be true if multiple values are ok', () => {
      function* g() {
        yield* [1, 3, 4, 7, 8, 10, 1, 1, 3, 4, 4];
      }
      expect(stream(g()).has((v) => v > 4)).toEqual([true, 7]);
    });
    it('Should be false for empty streams', () => {
      function* g() {
        yield* [];
      }
      expect(stream(g()).has((v) => v > 0)).toEqual([false, null]);
    });
    it('Should be false if no value is ok', () => {
      function* g() {
        yield* [-2, -4, 0];
      }
      expect(stream(g()).has((v) => v > 0)).toEqual([false, null]);
    });
  });
  describe('join', () => {
    it('Should be able to join nothing', () => {
      function* g() {
        yield* [1, 2, 3, 4, 5];
      }
      const s = stream(g()).join();
      expect([...s]).toEqual([1, 2, 3, 4, 5]);
    });
    it('Should be able to join another iterable', () => {
      function* g1() {
        yield* [1, 2, 3, 4, 5];
      }
      function* g2() {
        yield* [8, 9];
      }
      const s = stream(g1()).join(g2());
      expect([...s]).toEqual([1, 2, 3, 4, 5, 8, 9]);
    });
    it('Should be able to join multiple other streams', () => {
      function* g1() {
        yield* [1, 2, 3, 4, 5];
      }
      function* g2() {
        yield* [8, 9];
      }
      const s = stream(g1()).join(g2(), g1());
      expect([...s]).toEqual([1, 2, 3, 4, 5, 8, 9, 1, 2, 3, 4, 5]);
    });
    it('Should be able to join multiple other streams while mapping the initial stream', () => {
      function* g1() {
        yield* [1, 2, 3, 4, 5];
      }
      function* g2() {
        yield* [8, 9];
      }
      const s = stream(g1())
        .map((v) => 10 * v)
        .join(g2(), g1());
      expect([...s]).toEqual([10, 20, 30, 40, 50, 8, 9, 1, 2, 3, 4, 5]);
    });
    it('Should be able to join infinite streams', () => {
      function* g1() {
        while (true) yield 1;
      }
      function* g2() {
        while (true) yield 2;
      }
      const s = stream(g1())
        .map((v) => 10 * v)
        .join(g2())
        .take(5);
      expect([...s]).toEqual([10, 10, 10, 10, 10]);
    });
    it('Should be able to join on nil', () => {
      function* g1() {
        yield* [1, 2, 3, 4, 5];
      }
      const s = Stream.nil().join(g1());
      expect([...s]).toEqual([1, 2, 3, 4, 5]);
    });
  });
  describe('getNthOrLast', () => {
    it('Should return the nth value of the stream', () => {
      function* g() {
        yield* [42, 5, 43, 8, 19];
      }
      const v = stream(g()).getNthOrLast(2);
      expect(v).toEqual(43);
    });
    it('Should return the last value if the stream is too small', () => {
      function* g() {
        yield* [42, 5, 43, 8, 19];
      }
      const v = stream(g()).getNthOrLast(20);
      expect(v).toEqual(19);
    });
    it('Should be null for empty streams', () => {
      const v = Stream.nil<number>().getNthOrLast(10);
      expect(v).toBe(null);
    });
    it('Should be able to run on infinite streams', () => {
      function* g() {
        let idx = 0;
        while (true) yield idx++;
      }
      const v = stream(g()).getNthOrLast(10);
      expect(v).toEqual(10);
    });
  });
});
