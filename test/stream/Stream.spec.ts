import * as assert from 'power-assert';
import { Stream, stream } from '../../src/stream/Stream';

describe("Stream", () => {
    describe("constructor", () => {
        it("Should have the same values as its underlying", () => {
            function* g() {
                yield* [1, 42, 350, 0];
            }
            let s = stream(g());
            assert.deepEqual([...s], [1, 42, 350, 0]);
        });
        it("Should not be able to iterate twice", () => {
            function* g() {
                yield* [1, 42, 350, 0];
            }
            let s = stream(g());
            assert.deepEqual([...s], [1, 42, 350, 0]);
            assert.deepEqual([...s], []);
        });
        it("Should handle infinite generators", () => {
            function* g() {
                let idx = 0;
                while (true) {
                    yield ++idx;
                }
            }
            let s = stream(g());
            let data = [];
            for (let idx = 0 ; idx !== 5 ; ++idx) {
                data.push(s.next().value);
            }
            assert.deepEqual(data, [1, 2, 3, 4, 5]);
        });
    });
    describe("nil", () => {
        it("Should instantiate an empty stream", () => {
            let s: Stream<number> = Stream.nil<number>();
            assert.deepEqual([...s], []);
        });
    });
    describe("map", () => {
        it("Should apply on each element", () => {
            function* g() {
                yield* [1, 2, 3, 5];
            }
            let s = stream(g()).map(v => v*v);
            assert.deepEqual([...s], [1, 4, 9, 25]);
        });
        it("Should be able to perform conversions", () => {
            function* g() {
                yield* [1, 2, 3, 5];
            }
            let s: Stream<string> = stream(g()).map(v => String(v));
            assert.deepEqual([...s], ['1', '2', '3', '5']);
        });
    });
    describe("flatMap", () => {
        it("Should apply on each element", () => {
            function* g() {
                yield* [1, 2, 3, 5];
            }
            function* expand(n: number) {
                for (let idx = 0 ; idx !== n ; ++idx) {
                    yield n;
                }
            }
            let s = stream(g()).flatMap(expand);
            assert.deepEqual([...s], [1, 2, 2, 3, 3, 3, 5, 5, 5, 5, 5]);
        });
        it("Should handle correctly empty iterables", () => {
            function* g() {
                yield* [1, 2, 3, 0, 5];
            }
            function* noexpand(n: number) {
                if (n >= 3) {
                    yield n;
                }
            }
            let s = stream(g()).flatMap(noexpand);
            assert.deepEqual([...s], [3, 5]);
        });
    });
    describe("drop", () => {
        it("Should drop the right number of elements", () => {
            function* g() {
                yield* [1, 2, 3, 4, 5, 6];
            }
            let s = stream(g()).drop(2);
            assert.deepEqual([...s], [3, 4, 5, 6]);
        });
    });
    describe("dropWhile", () => {
        it("Should drop while predicate stays valid", () => {
            function* g() {
                yield* [-4, -2, -3, 1, -8, 7];
            }
            let s = stream(g()).dropWhile(v => v < 0);
            assert.deepEqual([...s], [1, -8, 7]);
        });
        it("Should drop everything", () => {
            function* g() {
                yield* [-4, -2, -3, 1, -8, 7];
            }
            let s = stream(g()).dropWhile(v => true);
            assert.deepEqual([...s], []);
        });
        it("Should drop nothing", () => {
            function* g() {
                yield* [-4, -2, -3, 1, -8, 7];
            }
            let s = stream(g()).dropWhile(v => false);
            assert.deepEqual([...s], [-4, -2, -3, 1, -8, 7]);
        });
    });
    describe("take", () => {
        it("Should take the right number of elements", () => {
            function* g() {
                yield* [1, 2, 3, 4, 5, 6];
            }
            let s = stream(g()).take(4);
            assert.deepEqual([...s], [1, 2, 3, 4]);
        });
    });
    describe("takeWhile", () => {
        it("Should take while predicate stays valid", () => {
            function* g() {
                yield* [-4, -2, -3, 1, -8, 7];
            }
            let s = stream(g()).takeWhile(v => v < 0);
            assert.deepEqual([...s], [-4, -2, -3]);
        });
        it("Should take everything", () => {
            function* g() {
                yield* [-4, -2, -3, 1, -8, 7];
            }
            let s = stream(g()).takeWhile(v => true);
            assert.deepEqual([...s], [-4, -2, -3, 1, -8, 7]);
        });
        it("Should take nothing", () => {
            function* g() {
                yield* [-4, -2, -3, 1, -8, 7];
            }
            let s = stream(g()).takeWhile(v => false);
            assert.deepEqual([...s], []);
        });
    });
    describe("filter", () => {
        it("Should remove undesirable values", () => {
            function* g() {
                yield* [1, 3, 4, 7, 8, 10, 1, 1, 3, 4, 4];
            }
            let s = stream(g()).filter(v => (v % 2) === 0);
            assert.deepEqual([...s], [4, 8, 10, 4, 4]);
        });
    });
    describe("every", () => {
        it("Should be true if all values are ok", () => {
            function* g() {
                yield* [1, 3, 4, 7, 8, 10, 1, 1, 3, 4, 4];
            }
            assert.ok(stream(g()).every(v => v > 0));
        });
        it("Should be true for empty streams", () => {
            function* g() {
                yield* [];
            }
            assert.ok(stream(g()).every(v => v > 0));
        });
        it("Should be false if it starts by a failing value", () => {
            function* g() {
                yield* [0, 1, 3, 4, 7, 8, 10, 1, 1, 3, 4, 4];
            }
            assert.equal(stream(g()).every(v => v > 0), false);
        });
        it("Should be false if it ends by a failing value", () => {
            function* g() {
                yield* [1, 3, 4, 7, 8, 10, 1, 1, 3, 4, 4, 0];
            }
            assert.equal(stream(g()).every(v => v > 0), false);
        });
        it("Should be false if it contains a failing value", () => {
            function* g() {
                yield* [1, 3, 4, 7, 8, 10, 0, 1, 1, 3, 4, 4];
            }
            assert.equal(stream(g()).every(v => v > 0), false);
        });
    });
    describe("has", () => {
        it("Should be true if one of the values is ok", () => {
            function* g() {
                yield* [1, 3, 4, 7, 8, 10, 1, 1, 3, 4, 4];
            }
            assert.deepStrictEqual(stream(g()).has(v => v > 9), [true, 10]);
        });
        it("Should be true if multiple values are ok", () => {
            function* g() {
                yield* [1, 3, 4, 7, 8, 10, 1, 1, 3, 4, 4];
            }
            assert.deepStrictEqual(stream(g()).has(v => v > 4), [true, 7]);
        });
        it("Should be false for empty streams", () => {
            function* g() {
                yield* [];
            }
            assert.deepStrictEqual(stream(g()).has(v => v > 0), [false, null]);
        });
        it("Should be false if no value is ok", () => {
            function* g() {
                yield* [-2, -4, 0];
            }
            assert.deepStrictEqual(stream(g()).has(v => v > 0), [false, null]);
        });
    });
    describe("join", () => {
        it("Should be able to join nothing", () => {
            function* g() {
                yield* [1, 2, 3, 4, 5];
            }
            let s = stream(g()).join();
            assert.deepEqual([...s], [1, 2, 3, 4, 5]);
        });
        it("Should be able to join another iterable", () => {
            function* g1() {
                yield* [1, 2, 3, 4, 5];
            }
            function* g2() {
                yield* [8, 9];
            }
            let s = stream(g1()).join(g2());
            assert.deepEqual([...s], [1, 2, 3, 4, 5, 8, 9]);
        });
        it("Should be able to join multiple other streams", () => {
            function* g1() {
                yield* [1, 2, 3, 4, 5];
            }
            function* g2() {
                yield* [8, 9];
            }
            let s = stream(g1()).join(g2(), g1());
            assert.deepEqual([...s], [1, 2, 3, 4, 5, 8, 9, 1, 2, 3, 4, 5]);
        });
    });
});
