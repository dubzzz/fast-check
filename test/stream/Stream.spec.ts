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
});
