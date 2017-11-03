export default class Stream<T> implements IterableIterator<T> {
    readonly g: IterableIterator<T>;

    constructor(g: IterableIterator<T>) {
        this.g = g;
    }

    next(value?: any): IteratorResult<T> {
        return this.g.next();
    }
    [Symbol.iterator](): IterableIterator<T> {
        return this.g;
    }

    map<U>(f: (v: T) => U): Stream<U> {
        function* helper(v: T): IterableIterator<U> {
            yield f(v);
        }
        return this.flatMap(helper);
    }
    flatMap<U>(f: (v: T) => IterableIterator<U>): Stream<U> {
        function* helper(g: IterableIterator<T>): IterableIterator<U> {
            for (const v of g) {
                yield* f(v);
            }
        }
        return new Stream(helper(this.g));
    }
}

function stream<T>(g: IterableIterator<T>): Stream<T> {
    return new Stream<T>(g);
}

export { stream, Stream };
